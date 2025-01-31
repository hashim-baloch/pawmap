const express = require("express");
const pool = require("../dbcon.js");
const multer = require("multer");
const path = require("path");

const animals = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images and videos are allowed!"));
  },
});

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

animals.post("/add-animal", upload.array("assets", 10), async (req, res) => {
  const {
    animalName, // Using 'animalName' exclusively
    animalType,
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

  // Get file URLs from uploaded files
  const assetUrls = req.files
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];

  try {
    const results = await pool.query(
      `INSERT INTO animals (
        animal_name, animal_type, color, size, 
        health_status, incident, last_seen, latitude, longitude, 
        radius, color_code, assets
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        animalName, // Ensure 'animalName' is used
        animalType,
        color,
        size,
        healthStatus,
        incident,
        lastSeen || new Date(),
        latitude,
        longitude,
        radius || 1000,
        colorCode,
        JSON.stringify(assetUrls),
      ]
    );
    return res.status(201).json(results.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

animals.patch(
  "/:animalId/update",
  upload.array("assets", 10),
  async (req, res) => {
    const animalId = req.params.animalId;
    const updates = req.body;

    try {
      // Get existing assets
      const existingAnimal = await pool.query(
        "SELECT assets FROM animals WHERE id = $1",
        [animalId]
      );
      const existingAssets = existingAnimal.rows[0]?.assets || [];

      // Add new asset URLs
      const newAssetUrls = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [];
      const updatedAssets = [...existingAssets, ...newAssetUrls];
      updates.assets = JSON.stringify(updatedAssets);

      // Remove 'breed' from updates if present
      delete updates.breed;

      const setClause = Object.keys(updates)
        .map((key, i) => {
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
  }
);

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
