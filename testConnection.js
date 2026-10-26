// testConnection.js - verifies Node can reach the Capsule database
const pool = require('./db');

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database:', process.env.DB_NAME);
    conn.release();

    const [users] = await pool.query(
      'SELECT user_id, username, email, first_name, last_name, style_pref, city FROM users'
    );
    console.log(`\nFound ${users.length} users in the users table:`);
    console.table(users);
  } catch (err) {
    console.error('Database connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();