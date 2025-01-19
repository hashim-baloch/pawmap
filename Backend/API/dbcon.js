const Pool = require("pg").Pool;

const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    password: 'straypassword',
    database: 'strayAnimalTracker',
    port: 5432
}

const pool = new Pool(dbConfig);
module.exports = pool;
