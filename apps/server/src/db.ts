import pg from 'pg'
import { config } from './config.ts'

export const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 10 })

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params)
  return result.rows
}

export async function one<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  const rows = await query<T>(text, params)
  return rows[0] as T | undefined
}
