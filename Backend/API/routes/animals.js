// set up express
const express = require("express");
const pool = require("../dbcon.js");

const animals = express.Router();

animals.get('/get/all', async (req, res) => {
    try {
      const results = await pool.query("SELECT * FROM animals");
      return res.status(200).json(results.rows);
    }
    catch (err) {
      return res.status(500).json({"error": err});
    }
})

animals.get('/get/:animalId', async (req, res) => {
  const animalId = parseInt(req.params.animalId);

  try {
    const results = await pool.query("SELECT * FROM animals WHERE id = $1", [animalId]);
    return res.status(200).json(results.rows);
  }
  catch (err) {
    return res.status(500).json({"error": err});
  }
})

animals.post('/add-animal', async (req, res) => {
  const { animalName, animalType, incident, healthStatus, latitude, longitude } = req.body;

  if (!animalName) return res.status(400).send({"error": "Animal name is required"});
  if (!animalType) return res.status(400).send({"error": "Animal type is required"});
  if (!incident) return res.status(400).send({"error": "Incident is required"});
  if (!healthStatus) return res.status(400).send({"error": "Health status is required"});
  if (!latitude) return res.status(400).send({"error": "Latitude is required"});
  if (!longitude) return res.status(400).send({"error": "Longitude is required"});

  try {
    const results = await pool.query("INSERT INTO animals (animal_name, animal_type, incident, health_status, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [animalName, animalType, incident, healthStatus, latitude, longitude])
    return res.status(200).json({"message": "Animal added successfully!", "results": results.rows});
  }  
  catch (err) {
    return res.status(500).json({"error": err});
  }
})

animals.patch('/:animalId/update', async (req, res) => {
  const animalId = req.params.animalId;
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({"error": 'No fields to update provided'});
  }

  try {
    const setClause = Object.keys(updates)
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(', ');

    const values = Object.values(updates);
    const results = await pool.query(`UPDATE animals SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`, [...values, animalId]);

    if (results.rowCount === 0) {
      return res.status(404).json({"error": "Animal does not exist"});
    }

    res.status(200).json({"message": "Animal updated successfully!", "results": results.rows});
  } catch (error) {
    res.status(500).json({"error": error});
  }
});

animals.delete('/found/:animalId', async (req, res) => {
  const animalId = parseInt(req.params.animalId);

  try {
    const results = await pool.query('DELETE FROM animals WHERE id = $1 RETURNING *', [animalId]);
    if (results.rowCount < 1) return res.status(404).json({"error": "Animal does not exist"});

    return res.status(200).json({"message": "Animal has been found!", "results": results.rows});
  }
  catch (error) {
    res.status(500).json({"error": error});
  }
})

animals.delete('/found/all', async (req, res) => {
  try {
    const results = await pool.query("DELETE FROM animals RETURNING *");
    return res.status(200).json({"message": "Found all animals!", "results": results.rows});
  }
  catch (error) {
    res.status(500).json({"error": error});
  }
})

module.exports = animals;