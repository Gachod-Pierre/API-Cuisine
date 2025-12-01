const express = require('express');
const router = express.Router();
const database = require('../config/database').getDB();
const { authenticate } = require('../middleware/auth');

// ============================================
// SQL QUERIES ORGANIZED AT TOP
// ============================================

const sql = {
    // GET queries
    getAll: `
        SELECT ingredient_id, name, unit
        FROM Ingredients
        ORDER BY name ASC
    `,

    getById: `
        SELECT ingredient_id, name, unit
        FROM Ingredients
        WHERE ingredient_id = ?
    `,

    getRecipesByIngredient: `
        SELECT
            r.recipe_id,
            r.title,
            r.description,
            r.image_url,
            ri.quantity
        FROM Recipes r
        JOIN RecipeIngredients ri ON r.recipe_id = ri.recipe_id
        WHERE ri.ingredient_id = ?
    `,

    // POST queries
    create: `
        INSERT INTO Ingredients (name, unit)
        VALUES (?, ?)
    `,

    // PUT queries
    update: `
        UPDATE Ingredients
        SET name = ?, unit = ?
        WHERE ingredient_id = ?
    `,

    // DELETE queries
    deleteIngredient: 'DELETE FROM Ingredients WHERE ingredient_id = ?',

    // Check if ingredient exists
    checkExists: 'SELECT ingredient_id FROM Ingredients WHERE ingredient_id = ?'
};

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * Get all ingredients
 * GET /api/ingredients
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
 * Get ingredient by ID with associated recipes
 * GET /api/ingredients/:id
 */
router.get('/:id', (req, res) => {
    const ingredientId = req.params.id;

    database.get(sql.getById, [ingredientId], (err, ingredient) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: 'Ingredient not found'
            });
        }

        // Get recipes that use this ingredient
        database.all(sql.getRecipesByIngredient, [ingredientId], (err, recipes) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching recipes for this ingredient',
                    error: err.message
                });
            }

            // Combine ingredient data with recipes
            ingredient.recipes = recipes;
            ingredient.recipe_count = recipes.length;

            res.status(200).json({
                success: true,
                data: ingredient
            });
        });
    });
});

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * Create a new ingredient
 * POST /api/ingredients
 * Requires authentication
 */
router.post('/', authenticate, (req, res) => {
    const { name, unit } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Ingredient name is required and must not be empty'
        });
    }

    if (!unit || unit.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Unit is required and must not be empty'
        });
    }

    database.run(sql.create, [name.trim(), unit.trim()], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create ingredient',
                error: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Ingredient created successfully',
            data: {
                ingredient_id: this.lastID,
                name: name.trim(),
                unit: unit.trim()
            }
        });
    });
});

/**
 * Update ingredient
 * PUT /api/ingredients/:id
 * Requires authentication
 */
router.put('/:id', authenticate, (req, res) => {
    const ingredientId = req.params.id;
    const { name, unit } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Ingredient name is required and must not be empty'
        });
    }

    if (!unit || unit.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Unit is required and must not be empty'
        });
    }

    // First check if ingredient exists
    database.get(sql.checkExists, [ingredientId], (err, row) => {
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
                message: 'Ingredient not found'
            });
        }

        // Update the ingredient
        database.run(sql.update, [name.trim(), unit.trim(), ingredientId], function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update ingredient',
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                message: 'Ingredient updated successfully',
                data: {
                    ingredient_id: ingredientId,
                    name: name.trim(),
                    unit: unit.trim()
                }
            });
        });
    });
});

/**
 * Delete ingredient
 * DELETE /api/ingredients/:id
 * Requires authentication
 */
router.delete('/:id', authenticate, (req, res) => {
    const ingredientId = req.params.id;

    // First check if ingredient exists
    database.get(sql.checkExists, [ingredientId], (err, row) => {
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
                message: 'Ingredient not found'
            });
        }

        // Delete the ingredient
        database.run(sql.deleteIngredient, [ingredientId], function (err) {
            if (err) {
                // Check if error is due to foreign key constraint
                if (err.message.includes('FOREIGN KEY constraint failed')) {
                    return res.status(409).json({
                        success: false,
                        message: 'Cannot delete ingredient: It is used by existing recipes. Please remove it from those recipes first.'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete ingredient',
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                message: 'Ingredient deleted successfully'
            });
        });
    });
});

module.exports = router;
