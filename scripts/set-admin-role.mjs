// Promotes a user to the admin role. Run once to bootstrap your first
// admin; after that, admins can promote others from /admin/users in the
// app instead of needing this script again.
//
// Usage:
//   node --env-file=.env.local scripts/set-admin-role.mjs someone@example.com
import { Pool } from 'pg'

const email = process.argv[2]
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/set-admin-role.mjs <email>')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  const result = await pool.query(
    `UPDATE "user" SET role = 'admin' WHERE email = $1 RETURNING id, name, email, role`,
    [email],
  )
  if (result.rowCount === 0) {
    console.error(`No user found with email ${email}. Sign up first, then run this.`)
    process.exit(1)
  }
  console.log('Promoted to admin:', result.rows[0])
} finally {
  await pool.end()
}
