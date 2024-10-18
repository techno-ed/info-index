const mysql = require('mysql2/promise');
const path = require('path');

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试连接
pool.getConnection()
  .then(connection => {
    console.log('Connected to database');
    connection.release();
  })
  .catch(err => {
    console.error('Could not connect to database', err);
  });

// 查询函数
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

module.exports = {
  query
};
