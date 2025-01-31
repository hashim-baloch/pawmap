/*
  # Create animals table with extended fields

  1. New Tables
    - `animals`
      - `id` (uuid, primary key)
      - `animal_name` (text)
      - `animal_type` (text)
      - `breed` (text)
      - `color` (text)
      - `size` (text)
      - `health_status` (text)
      - `incident` (text)
      - `last_seen` (timestamptz)
      - `latitude` (float8)
      - `longitude` (float8)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `radius` (float8)
      - `color_code` (text)
*/

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_animals_updated_at ON animals;
DROP FUNCTION IF EXISTS update_updated_at();

-- Create or update the table
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
  color_code text
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_animals_updated_at
  BEFORE UPDATE ON animals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();