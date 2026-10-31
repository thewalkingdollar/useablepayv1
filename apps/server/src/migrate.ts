import { readdir, readFile } from 'node:fs/promises'
import { pool } from './db.ts'

const dir = new URL('../migrations/', import.meta.url)

const client = await pool.connect()
try {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
  const applied = new Set((await client.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map((r) => r.name))
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    if (applied.has(file)) continue
    const sql = await readFile(new URL(file, dir), 'utf8')
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`applied ${file}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
  console.log('database is up to date')
} finally {
  client.release()
  await pool.end()
}
