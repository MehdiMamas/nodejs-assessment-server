const mysql = require("mysql2/promise");
const namedPlaceholders = require("named-placeholders")();
const chalk = require("chalk"); // Revert to require for chalk

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "your_db_user",
  password: process.env.DB_PASSWORD || "your_db_password",
  database: process.env.DB_NAME || "your_db_name",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function injectParams(sql, values) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    const val = values[index++];
    if (val === null) return "NULL";
    if (typeof val === "number") return val;
    return `'${String(val).replace(/'/g, "''")}'`; // escape single quotes
  });
}

async function PromisifiedQuery(query, params = {}) {
  const [sql, values] = namedPlaceholders(query, params);
  try {
    const [rows] = await pool.execute(sql, values);
    return rows;
  } catch (error) {
    const parsedSql = injectParams(sql, values);
    console.error(
      chalk.red.bold("\n[SQL ERROR]"),
      chalk.yellowBright(parsedSql)
    );
    console.error(
      chalk.red("[MESSAGE]"),
      chalk.whiteBright(error.message),
      "\n"
    );
  }
}

module.exports = {
  pool,
  PromisifiedQuery,
};
