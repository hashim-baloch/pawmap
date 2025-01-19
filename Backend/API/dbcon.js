require("dotenv").config()
const Pool = require("pg").Pool;

const dbConfig = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: process.env.POSTGRES_PORT
}

const pool = new Pool(dbConfig);
module.exports = pool;
