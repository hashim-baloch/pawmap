const express = require("express");
const pg = require('../dbcon');
const fs = require("fs");
const path = require("path");
const pool = require("../dbcon");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const images = express.Router();

images.post('/:animalId/upload', upload.single('image'), async (req, res) => {
    const { buffer, originalname } = req.file;
    const animalId = parseInt(req.params.animalId);

    try {
        const chunkSize = 50000;
        
        const byteaChunks = [];
        for (let i = 0; i < buffer.length; i += chunkSize) {
            byteaChunks.push(buffer.slice(i, i + chunkSize));
        }
        
        const results = await pool.query("INSERT INTO images (image, animal_id, filename) VALUES ($1, $2, $3) RETURNING *", [byteaChunks, animalId, originalname]);
        return res.status(200).json({"message": "Image uploaded successfully!", "results": results.rows});
    }
    catch (err) {
        return res.status(500).json({"error": err});
    }
})

images.get('/:animalId/get-all', async (req, res) => {
    const animalId = parseInt(req.params.animalId);

    try {
        const results = await pool.query("SELECT image FROM images WHERE animal_id = $1", [animalId]);
        if (results.rows.length < 1) {
            return res.status(400).json({
                "error": "No images exist"
            })
        }

        const images = results.rows.map(imageRow => {
            return {
                image: `data:image/jpeg;base64,${imageRow.image.toString('base64')}`,
            };
        });

        return res.status(200).json(images);
    }
    catch (err) {
        return res.status(500).json({"error": err});
    }
})

images.delete('/delete/:imageId', async (req, res) => {
    const imageId = parseInt(req.params.imageId);

    try {
        const results = await pool.query("DELETE FROM images WHERE id = $1 RETURNING *", [imageId]);
        if (results.rowCount < 1) {
            return res.status(404).json({"error": "Image not found"})
        }

        return res.status(200).json({"message": "Image deleted successfully!", "results": results.rows});
    }
    catch (err) {
        return res.status(500).json({"error": err});
    }
})

images.delete('/found/all', async (req, res) => {
    try {
        const results = await pool.query("DELETE FROM images RETURNING *");
        return res.status(200).json({"message": "Deleted all images successfully!", "results": results.rows});
    }
    catch (error) {
        res.status(500).json({"error": error});
    }
})

module.exports = images;
