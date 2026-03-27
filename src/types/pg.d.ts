declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
  }

  export class DatabaseError extends Error {
    code?: string;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    end(): Promise<void>;
  }
}
