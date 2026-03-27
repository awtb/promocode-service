import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { startE2EApp } from "./bootstrap.js";

const getUtcDate = (offsetDays = 0) => {
  const date = new Date();

  date.setUTCDate(date.getUTCDate() + offsetDays);

  return date.toISOString().slice(0, 10);
};

const createPromocodePayload = (overrides: Partial<{
  code: string;
  discountPercent: number;
  activationsLimit: number;
  expiresAt: string;
}> = {}) => ({
  code: `CODE-${randomUUID()}`,
  discountPercent: 15,
  activationsLimit: 5,
  expiresAt: getUtcDate(1),
  ...overrides,
});

const runConcurrent = async <T>(tasks: Array<() => Promise<T>>) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  const pendingTasks = tasks.map(async (task) => {
    await gate;

    return task();
  });

  release();

  return Promise.all(pendingTasks);
};

describe("promocodes e2e", () => {
  let app: FastifyInstance;
  let baseUrl: string;
  let resetDatabase: () => Promise<void>;
  let shutdown: (() => Promise<void>) | null = null;

  beforeAll(async () => {
    ({ app, baseUrl, resetDatabase, shutdown } = await startE2EApp());
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    if (shutdown) {
      await shutdown();
    }
  });

  const createPromocode = async (
    overrides: Partial<{
      code: string;
      discountPercent: number;
      activationsLimit: number;
      expiresAt: string;
    }> = {},
  ) => {
    const response = await app.inject({
      method: "POST",
      url: "/promocodes",
      payload: createPromocodePayload(overrides),
    });

    expect(response.statusCode).toBe(201);

    return response.json();
  };

  const activatePromocode = async (code: string, email: string) => {
    return app.inject({
      method: "POST",
      url: `/promocodes/${code}/activate`,
      payload: { email },
    });
  };

  const activatePromocodeOverHttp = async (code: string, email: string) => {
    const response = await fetch(`${baseUrl}/promocodes/${code}/activate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    return {
      statusCode: response.status,
      body: await response.json(),
    };
  };

  it("creates a promocode successfully", async () => {
    const payload = createPromocodePayload({
      code: "SPRING-15",
      discountPercent: 15,
      activationsLimit: 3,
      expiresAt: getUtcDate(7),
    });

    const response = await app.inject({
      method: "POST",
      url: "/promocodes",
      payload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      code: payload.code,
      discountPercent: payload.discountPercent,
      activationsCount: 0,
      activationsLimit: payload.activationsLimit,
      expiresAt: payload.expiresAt,
    });
  });

  it("does not allow creating a duplicate promocode", async () => {
    const payload = createPromocodePayload({
      code: "DUPLICATE-CODE",
    });

    const firstResponse = await app.inject({
      method: "POST",
      url: "/promocodes",
      payload,
    });
    const secondResponse = await app.inject({
      method: "POST",
      url: "/promocodes",
      payload,
    });
    const listResponse = await app.inject({
      method: "GET",
      url: "/promocodes?limit=10&offset=0",
    });

    expect(firstResponse.statusCode).toBe(201);
    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toEqual({
      message: "Promocode with this code already exists",
    });
    expect(listResponse.statusCode).toBe(200);
    expect(
      listResponse
        .json()
        .filter((promocode: { code: string }) => promocode.code === payload.code),
    ).toHaveLength(1);
  });

  it("gets a promocode by id successfully", async () => {
    const createdPromocode = await createPromocode({
      code: "GET-BY-ID",
    });

    const response = await app.inject({
      method: "GET",
      url: `/promocodes/${createdPromocode.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(createdPromocode);
  });

  it("lists promocodes successfully", async () => {
    const firstPromocode = await createPromocode({
      code: "LIST-FIRST",
    });
    const secondPromocode = await createPromocode({
      code: "LIST-SECOND",
    });

    const response = await app.inject({
      method: "GET",
      url: "/promocodes?limit=10&offset=0",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstPromocode.id, code: firstPromocode.code }),
        expect.objectContaining({ id: secondPromocode.id, code: secondPromocode.code }),
      ]),
    );
  });

  it("does not allow the same email to activate the same promocode twice", async () => {
    const promocode = await createPromocode({
      code: "ONE-EMAIL-ONCE",
      activationsLimit: 2,
    });

    const firstResponse = await activatePromocode(promocode.code, "usEr@example.com");
    const secondResponse = await activatePromocode(promocode.code, "user@example.com");
    const getResponse = await app.inject({
      method: "GET",
      url: `/promocodes/${promocode.id}`,
    });

    expect(firstResponse.statusCode).toBe(201);
    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toEqual({
      message: "Promocode already activated for this email",
    });
    expect(getResponse.json()).toMatchObject({
      id: promocode.id,
      activationsCount: 1,
    });
  });

  it("returns a concrete error when the activation limit is reached", async () => {
    const promocode = await createPromocode({
      code: "LIMIT-REACHED",
      activationsLimit: 1,
    });

    const firstResponse = await activatePromocode(promocode.code, "first@example.com");
    const secondResponse = await activatePromocode(promocode.code, "second@example.com");
    const getResponse = await app.inject({
      method: "GET",
      url: `/promocodes/${promocode.id}`,
    });

    expect(firstResponse.statusCode).toBe(201);
    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toEqual({
      message: "Promocode activation limit reached",
      activationsLimit: 1,
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      id: promocode.id,
      activationsCount: 1,
      activationsLimit: 1,
    });
  });

  it("does not exceed the activation limit under concurrency", async () => {
    const promocode = await createPromocode({
      code: "CONCURRENCY-LIMIT",
      activationsLimit: 3,
    });

    const responses = await runConcurrent(
      Array.from({ length: 10 }, (_, index) => {
        const email = `limit-${index}@example.com`;

        return () => activatePromocodeOverHttp(promocode.code, email);
      }),
    );

    const successfulResponses = responses.filter(
      (response) => response.statusCode === 201,
    );
    const failedResponses = responses.filter((response) => response.statusCode === 409);

    expect(successfulResponses).toHaveLength(3);
    expect(failedResponses).toHaveLength(7);
    expect(
      failedResponses.every(
        (response) =>
          response.body.message === "Promocode activation limit reached",
      ),
    ).toBe(true);

    const getResponse = await app.inject({
      method: "GET",
      url: `/promocodes/${promocode.id}`,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      id: promocode.id,
      activationsCount: 3,
      activationsLimit: 3,
    });
  });

  it("persists activationsCount equal to the successful concurrent activations", async () => {
    const promocode = await createPromocode({
      code: "CONCURRENCY-COUNT",
      activationsLimit: 4,
    });

    const responses = await runConcurrent(
      Array.from({ length: 12 }, (_, index) => {
        const email = `count-${index}@example.com`;

        return () => activatePromocodeOverHttp(promocode.code, email);
      }),
    );
    const successfulActivations = responses.filter(
      (response) => response.statusCode === 201,
    ).length;
    const getResponse = await app.inject({
      method: "GET",
      url: `/promocodes/${promocode.id}`,
    });

    expect(successfulActivations).toBe(4);
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      id: promocode.id,
      activationsCount: successfulActivations,
      activationsLimit: 4,
    });
  });

  it("does not allow the same normalized email to activate the same promocode under concurrency", async () => {
    const promocode = await createPromocode({
      code: "CONCURRENT-SAME-EMAIL",
      activationsLimit: 2,
    });

    const responses = await runConcurrent([
      () => activatePromocodeOverHttp(promocode.code, "UsEr@example.com"),
      () => activatePromocodeOverHttp(promocode.code, "user@example.com"),
    ]);
    const successfulResponses = responses.filter(
      (response) => response.statusCode === 201,
    );
    const failedResponses = responses.filter(
      (response) => response.statusCode === 409,
    );
    const getResponse = await app.inject({
      method: "GET",
      url: `/promocodes/${promocode.id}`,
    });

    expect(successfulResponses).toHaveLength(1);
    expect(failedResponses).toHaveLength(1);
    expect(failedResponses[0]?.body).toEqual({
      message: "Promocode already activated for this email",
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      id: promocode.id,
      activationsCount: 1,
    });
  });

  it("does not allow activation of an expired promocode", async () => {
    const expiresAt = getUtcDate(-1);
    const promocode = await createPromocode({
      code: "EXPIRED-CODE",
      expiresAt,
    });

    const response = await activatePromocode(promocode.code, "expired@example.com");

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Promocode is expired",
      expiresAt,
    });
  });

  it("allows activation on the exact expiresAt date", async () => {
    const expiresAt = getUtcDate(0);
    const promocode = await createPromocode({
      code: "EXPIRES-TODAY",
      expiresAt,
    });

    const response = await activatePromocode(promocode.code, "today@example.com");

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      kind: "success",
      activationsCount: 1,
      activationsLimit: promocode.activationsLimit,
      activation: {
        promocodeId: promocode.id,
        email: "today@example.com",
      },
    });
  });
});
