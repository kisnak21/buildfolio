import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const email = process.argv[2]

if (!email) {
  console.error('Usage: node scripts/promote-admin.mjs <email>')
  process.exit(1)
}

try {
  const result = await pool.query(
    "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, role",
    [email],
  )
  if (result.rowCount === 0) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }
  const user = result.rows[0]
  console.log(`Promoted ${user.email} to ${user.role} (${user.id})`)
} catch (err) {
  console.error('Promote failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}