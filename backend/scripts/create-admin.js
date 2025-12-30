import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tenderhub',
  user: process.env.DB_USER || 'tenderhub',
  password: process.env.DB_PASSWORD || 'password',
});

async function createAdmin() {
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  const fullName = process.argv[4] || 'Admin User';

  try {
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`User ${email} already exists`);
      process.exit(0);
    }

    // Create admin user
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, hash, fullName, 'admin']
    );

    console.log('Admin user created successfully:');
    console.log(`  Email: ${result.rows[0].email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${result.rows[0].role}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();

