import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResult } from "pg";
import { getEnv } from "../config/env";

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const env = getEnv();
    this.pool = new Pool({ connectionString: env.DATABASE_URL });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }
}
