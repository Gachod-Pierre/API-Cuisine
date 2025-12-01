const express = require('express');
const router = express.Router();
const database = require('../config/database').getDB();
const { requireAdmin } = require('../middleware/auth');

// ============================================
// SQL QUERIES ORGANIZED AT TOP
// ============================================

const sql = {
    // GET queries
    getAll: `
        SELECT cuisine_id, name
        FROM Cuisines
        ORDER BY name ASC
    `,

    getById: `
        SELECT cuisine_id, name
        FROM Cuisines
        WHERE cuisine_id = ?
    `,

    getRecipesByCuisine: `
        SELECT
            r.recipe_id,
            r.title,
            r.description,
            r.image_url
        FROM Recipes r
        WHERE r.cuisine_id = ?
    `,

    // POST queries
    create: `
        INSERT INTO Cuisines (name)
        VALUES (?)
    `,

    // PUT queries
    update: `
        UPDATE Cuisines
        SET name = ?
        WHERE cuisine_id = ?
    `,

    // DELETE queries
    deleteCuisine: 'DELETE FROM Cuisines WHERE cuisine_id = ?',

    // Check if cuisine exists
    checkExists: 'SELECT cuisine_id FROM Cuisines WHERE cuisine_id = ?'
};

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * Get all cuisines
 * GET /api/cuisines
 */
router.get('/', (req, res) => {
    database.all(sql.getAll, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    });
});

/**
 * Get cuisine by ID with associated recipes
 * GET /api/cuisines/:id
 */
router.get('/:id', (req, res) => {
    const cuisineId = req.params.id;

    database.get(sql.getById, [cuisineId], (err, cuisine) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!cuisine) {
            return res.status(404).json({
                success: false,
                message: 'Cuisine not found'
            });
        }

        // Get recipes for this cuisine
        database.all(sql.getRecipesByCuisine, [cuisineId], (err, recipes) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching recipes for this cuisine',
                    error: err.message
                });
            }

            // Combine cuisine data with recipes
            cuisine.recipes = recipes;
            cuisine.recipe_count = recipes.length;

            res.status(200).json({
                success: true,
                data: cuisine
            });
        });
    });
});

// ============================================
// ADMIN-ONLY ROUTES (Admin authentication required)
// ============================================

/**
 * Create a new cuisine
 * POST /api/cuisines
 * Requires admin authentication
 */
router.post('/', requireAdmin, (req, res) => {
    const { name } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Cuisine name is required and must not be empty'
        });
    }

    database.run(sql.create, [name.trim()], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create cuisine',
                error: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Cuisine created successfully',
            data: {
                cuisine_id: this.lastID,
                name: name.trim()
            }
        });
    });
});

/**
 * Update cuisine
 * PUT /api/cuisines/:id
 * Requires admin authentication
 */
router.put('/:id', requireAdmin, (req, res) => {
    const cuisineId = req.params.id;
    const { name } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Cuisine name is required and must not be empty'
        });
    }

    // First check if cuisine exists
    database.get(sql.checkExists, [cuisineId], (err, row) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Cuisine not found'
            });
        }

        // Update the cuisine
        database.run(sql.update, [name.trim(), cuisineId], function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update cuisine',
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                message: 'Cuisine updated successfully',
                data: {
                    cuisine_id: cuisineId,
                    name: name.trim()
                }
            });
        });
    });
});

/**
 * Delete cuisine
 * DELETE /api/cuisines/:id
 * Requires admin authentication
 */
router.delete('/:id', requireAdmin, (req, res) => {
    const cuisineId = req.params.id;

    // First check if cuisine exists
    database.get(sql.checkExists, [cuisineId], (err, row) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Cuisine not found'
            });
        }

        // Delete the cuisine
        database.run(sql.deleteCuisine, [cuisineId], function (err) {
            if (err) {
                // Check if error is due to foreign key constraint
                if (err.message.includes('FOREIGN KEY constraint failed')) {
                    return res.status(409).json({
                        success: false,
                        message: 'Cannot delete cuisine: It is used by existing recipes. Please remove or update those recipes first.'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete cuisine',
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                message: 'Cuisine deleted successfully'
            });
        });
    });
});

module.exports = router;
