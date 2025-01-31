require("dotenv").config();
const { Pool } = require("pg");

const dbConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: process.env.POSTGRES_PORT,
};

const pool = new Pool(dbConfig);

// Function to create the table if it doesn't exist
const createTable = async () => {
  const query = `
  CREATE TABLE IF NOT EXISTS animals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_name text,
    animal_type text NOT NULL,
    breed text,
    color text,
    size text,
    health_status text,
    incident text,
    last_seen timestamptz DEFAULT now(),
    latitude float8 NOT NULL,
    longitude float8 NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    radius float8 DEFAULT 1000,
    color_code text,
    assets JSONB DEFAULT '{}'
  );

  -- Create or replace the update_updated_at function
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Drop existing trigger if it exists, then recreate it
  DROP TRIGGER IF EXISTS update_animals_updated_at ON animals;
  CREATE TRIGGER update_animals_updated_at
  BEFORE UPDATE ON animals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
  `;

  try {
    const client = await pool.connect();
    await client.query(query);
    console.log("✅ Database setup complete!");
    client.release();
  } catch (err) {
    console.error("❌ Error setting up database:", err);
  }
};

// Run the table creation when the database connects
createTable();

module.exports = pool;
