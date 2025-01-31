const express = require("express");
const pool = require("../dbcon.js");

const animals = express.Router();

animals.get("/get/all", async (req, res) => {
  try {
    const results = await pool.query(
      "SELECT * FROM animals ORDER BY created_at DESC"
    );
    return res.status(200).json(results.rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});

animals.get("/get/:animalId", async (req, res) => {
  const animalId = req.params.animalId;

  try {
    const results = await pool.query("SELECT * FROM animals WHERE id = $1", [
      animalId,
    ]);
    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Animal not found" });
    }
    return res.status(200).json(results.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

animals.post("/add-animal", async (req, res) => {
  const {
    animalName,
    animalType,
    breed,
    color,
    size,
    healthStatus,
    incident,
    lastSeen,
    latitude,
    longitude,
    radius,
    colorCode,
  } = req.body;

  try {
    const results = await pool.query(
      `INSERT INTO animals (
        animal_name, animal_type, breed, color, size, 
        health_status, incident, last_seen, latitude, longitude, 
        radius, color_code
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        animalName,
        animalType,
        breed,
        color,
        size,
        healthStatus,
        incident,
        lastSeen || new Date(),
        latitude,
        longitude,
        radius || 1000,
        colorCode,
      ]
    );
    return res.status(201).json(results.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

animals.patch("/:animalId/update", async (req, res) => {
  const animalId = req.params.animalId;
  const updates = req.body;

  try {
    const setClause = Object.keys(updates)
      .map((key, i) => {
        // Convert camelCase to snake_case for database columns
        const column = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        );
        return `${column} = $${i + 1}`;
      })
      .join(", ");

    const values = Object.values(updates);

    const query = `
      UPDATE animals 
      SET ${setClause} 
      WHERE id = $${values.length + 1} 
      RETURNING *
    `;

    const results = await pool.query(query, [...values, animalId]);

    if (results.rowCount === 0) {
      return res.status(404).json({ error: "Animal not found" });
    }

    res.status(200).json(results.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

animals.delete("/found/:animalId", async (req, res) => {
  const animalId = req.params.animalId;

  try {
    const results = await pool.query(
      "DELETE FROM animals WHERE id = $1 RETURNING *",
      [animalId]
    );
    if (results.rowCount === 0) {
      return res.status(404).json({ error: "Animal not found" });
    }

    return res.status(200).json(results.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = animals;
