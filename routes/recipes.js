const express = require('express');
const router = express.Router();
const database = require('../config/database').getDB();
const { authenticate, checkRecipeOwnership } = require('../middleware/auth');

// ============================================
// SQL QUERIES ORGANIZED AT TOP
// ============================================

const sql = {
    // GET queries
    getAll: `
        SELECT
            r.recipe_id, r.title, r.description, r.image_url,
            c.name as cuisine_name,
            g.name as goal_name,
            d.name as diet_name,
            a.name as allergy_name
        FROM Recipes r
        LEFT JOIN Cuisines c ON r.cuisine_id = c.cuisine_id
        LEFT JOIN Goals g ON r.goal_id = g.goal_id
        LEFT JOIN DietaryInformation d ON r.DietaryInformation_id = d.diet_id
        LEFT JOIN AllergiesInformation a ON r.AllergiesInformation_id = a.allergy_id
    `,

    getById: `
        SELECT
            r.*,
            c.name as cuisine_name,
            g.name as goal_name,
            d.name as diet_name,
            a.name as allergy_name
        FROM Recipes r
        LEFT JOIN Cuisines c ON r.cuisine_id = c.cuisine_id
        LEFT JOIN Goals g ON r.goal_id = g.goal_id
        LEFT JOIN DietaryInformation d ON r.DietaryInformation_id = d.diet_id
        LEFT JOIN AllergiesInformation a ON r.AllergiesInformation_id = a.allergy_id
        WHERE r.recipe_id = ?
    `,

    getIngredients: `
        SELECT i.ingredient_id, i.name, i.unit, ri.quantity
        FROM RecipeIngredients ri
        JOIN Ingredients i ON ri.ingredient_id = i.ingredient_id
        WHERE ri.recipe_id = ?
    `,

    getInstructions: `
        SELECT instruction_id, step_number, description
        FROM RecipeInstructions
        WHERE recipe_id = ?
        ORDER BY step_number
    `,

    getByCuisine: `
        SELECT
            r.recipe_id, r.title, r.description, r.image_url,
            c.name as cuisine_name
        FROM Recipes r
        JOIN Cuisines c ON r.cuisine_id = c.cuisine_id
        WHERE r.cuisine_id = ?
    `,

    getByGoal: `
        SELECT
            r.recipe_id, r.title, r.description, r.image_url,
            g.name as goal_name
        FROM Recipes r
        JOIN Goals g ON r.goal_id = g.goal_id
        WHERE r.goal_id = ?
    `,

    getWithoutAllergen: `
        SELECT
            r.recipe_id, r.title, r.description, r.image_url,
            c.name as cuisine_name
        FROM Recipes r
        LEFT JOIN Cuisines c ON r.cuisine_id = c.cuisine_id
        WHERE r.AllergiesInformation_id != ? OR r.AllergiesInformation_id IS NULL
    `,

    getByUserId: `
        SELECT
            r.recipe_id, r.title, r.description, r.image_url,
            c.name as cuisine_name,
            g.name as goal_name,
            d.name as diet_name,
            a.name as allergy_name,
            r.average_rating,
            r.total_ratings
        FROM Recipes r
        LEFT JOIN Cuisines c ON r.cuisine_id = c.cuisine_id
        LEFT JOIN Goals g ON r.goal_id = g.goal_id
        LEFT JOIN DietaryInformation d ON r.DietaryInformation_id = d.diet_id
        LEFT JOIN AllergiesInformation a ON r.AllergiesInformation_id = a.allergy_id
        WHERE r.user_id = ?
        ORDER BY r.recipe_id DESC
    `,

    // POST queries
    create: `
        INSERT INTO Recipes (title, description, image_url, cuisine_id, goal_id, DietaryInformation_id, AllergiesInformation_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,

    addIngredient: `
        INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity)
        VALUES (?, ?, ?)
    `,

    // PUT queries
    updateTitle: 'UPDATE Recipes SET title = ? WHERE recipe_id = ?',

    updateAllergy: 'UPDATE Recipes SET AllergiesInformation_id = ? WHERE recipe_id = ?',

    updateInstruction: `
        UPDATE RecipeInstructions
        SET description = ?
        WHERE instruction_id = ? AND recipe_id = ?
    `,

    // DELETE queries
    deleteRecipe: 'DELETE FROM Recipes WHERE recipe_id = ?',

    removeIngredient: `
        DELETE FROM RecipeIngredients
        WHERE recipe_id = ? AND ingredient_id = ?
    `,

    // OWNERSHIP CHECK queries
    checkOwnership: 'SELECT user_id FROM Recipes WHERE recipe_id = ?'
};

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * Get all recipes
 * GET /api/recipes
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
 * Get recipes created by logged-in user
 * GET /api/recipes/my-recipes
 * Requires authentication
 */
router.get('/my-recipes', authenticate, (req, res) => {
    const userId = req.user.user_id;

    database.all(sql.getByUserId, [userId], (err, rows) => {
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
            data: rows,
            message: rows.length === 0 ? 'You have not created any recipes yet' : undefined
        });
    });
});

/**
 * Get recipe by ID with ingredients and instructions
 * GET /api/recipes/:id
 */
router.get('/:id', (req, res) => {
    const recipeId = req.params.id;

    database.get(sql.getById, [recipeId], (err, recipe) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }

        // Get ingredients for this recipe
        database.all(sql.getIngredients, [recipeId], (err, ingredients) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching ingredients',
                    error: err.message
                });
            }

            // Get instructions for this recipe
            database.all(sql.getInstructions, [recipeId], (err, instructions) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error fetching instructions',
                        error: err.message
                    });
                }

                // Combine all data
                recipe.ingredients = ingredients;
                recipe.instructions = instructions;

                res.status(200).json({
                    success: true,
                    data: recipe
                });
            });
        });
    });
});

/**
 * Get recipes by cuisine ID
 * GET /api/recipes/cuisine/:cuisineId
 */
router.get('/cuisine/:cuisineId', (req, res) => {
    const cuisineId = req.params.cuisineId;

    database.all(sql.getByCuisine, [cuisineId], (err, rows) => {
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
 * Get recipes without specific allergen
 * GET /api/recipes/no-allergens/:allergyId
 */
router.get('/no-allergens/:allergyId', (req, res) => {
    const allergyId = req.params.allergyId;

    database.all(sql.getWithoutAllergen, [allergyId], (err, rows) => {
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
 * Get recipes by goal ID
 * GET /api/recipes/goal/:goalId
 */
router.get('/goal/:goalId', (req, res) => {
    const goalId = req.params.goalId;

    database.all(sql.getByGoal, [goalId], (err, rows) => {
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

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * Create a new recipe
 * POST /api/recipes
 * Requires authentication
 */
router.post('/', authenticate, (req, res) => {
    const { title, description, image_url, cuisine_id, goal_id, DietaryInformation_id, AllergiesInformation_id } = req.body;
    const userId = req.user.user_id;

    // Validate required fields
    if (!title || !description || !cuisine_id || !goal_id) {
        return res.status(400).json({
            success: false,
            message: 'Title, description, cuisine_id, and goal_id are required'
        });
    }

    database.run(
        sql.create,
        [title, description, image_url, cuisine_id, goal_id, DietaryInformation_id, AllergiesInformation_id, userId],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create recipe',
                    error: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: 'Recipe created successfully',
                data: {
                    recipe_id: this.lastID,
                    title,
                    description,
                    user_id: userId
                }
            });
        }
    );
});

/**
 * Add ingredient to recipe
 * POST /api/recipes/:id/ingredients
 * Requires authentication
 */
router.post('/:id/ingredients', authenticate, (req, res) => {
    const recipeId = req.params.id;
    const { ingredient_id, quantity } = req.body;

    if (!ingredient_id || !quantity) {
        return res.status(400).json({
            success: false,
            message: 'ingredient_id and quantity are required'
        });
    }

    database.run(sql.addIngredient, [recipeId, ingredient_id, quantity], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to add ingredient',
                error: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Ingredient added to recipe'
        });
    });
});

/**
 * Update recipe title
 * PUT /api/recipes/:id/title
 * Requires authentication + ownership (checked by middleware)
 */
router.put('/:id/title', authenticate, checkRecipeOwnership, (req, res) => {
    const recipeId = req.params.id;
    const { title } = req.body;

    // Validate input
    if (!title || title.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Title is required and must not be empty'
        });
    }

    // Ownership already verified by checkRecipeOwnership middleware
    // User owns the recipe OR is admin - safe to update
    database.run(sql.updateTitle, [title, recipeId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update recipe',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recipe title updated successfully'
        });
    });
});

/**
 * Update recipe allergy information
 * PUT /api/recipes/:id/allergy
 * Requires authentication + ownership (checked by middleware)
 */
router.put('/:id/allergy', authenticate, checkRecipeOwnership, (req, res) => {
    const recipeId = req.params.id;
    const { AllergiesInformation_id } = req.body;

    // Ownership already verified by checkRecipeOwnership middleware
    database.run(sql.updateAllergy, [AllergiesInformation_id, recipeId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update allergy information',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: 'Allergy information updated successfully'
        });
    });
});

/**
 * Update recipe instruction
 * PUT /api/recipes/:id/instructions/:stepId
 * Requires authentication + ownership (checked by middleware)
 */
router.put('/:id/instructions/:stepId', authenticate, checkRecipeOwnership, (req, res) => {
    const recipeId = req.params.id;
    const stepId = req.params.stepId;
    const { description } = req.body;

    // Validate input
    if (!description) {
        return res.status(400).json({
            success: false,
            message: 'Description is required'
        });
    }

    // Ownership already verified by checkRecipeOwnership middleware
    database.run(sql.updateInstruction, [description, stepId, recipeId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update instruction',
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Instruction not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Instruction updated successfully'
        });
    });
});

/**
 * Delete recipe
 * DELETE /api/recipes/:id
 * Requires authentication + ownership (checked by middleware)
 */
router.delete('/:id', authenticate, checkRecipeOwnership, (req, res) => {
    const recipeId = req.params.id;

    // Ownership already verified by checkRecipeOwnership middleware
    // Delete the recipe (CASCADE will handle related records)
    database.run(sql.deleteRecipe, [recipeId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete recipe',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recipe deleted successfully'
        });
    });
});

/**
 * Remove ingredient from recipe
 * DELETE /api/recipes/:recipeId/ingredients/:ingredientId
 * Requires authentication + ownership (checked by middleware)
 */
router.delete('/:recipeId/ingredients/:ingredientId', authenticate, checkRecipeOwnership, (req, res) => {
    const recipeId = req.params.recipeId;
    const ingredientId = req.params.ingredientId;

    // Ownership already verified by checkRecipeOwnership middleware
    database.run(sql.removeIngredient, [recipeId, ingredientId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to remove ingredient',
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ingredient not found in recipe'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ingredient removed from recipe'
        });
    });
});

// ============================================
// INTERACTION ROUTES (No ownership check required)
// Users can interact with ANY recipe
// ============================================

/**
 * Add rating to recipe
 * POST /api/recipes/:id/ratings
 * Requires authentication (user can rate ANY recipe)
 */
router.post('/:id/ratings', authenticate, (req, res) => {
    const recipeId = req.params.id;
    const userId = req.user.user_id;
    const { rating, review } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5'
        });
    }

    // User can rate any recipe (not just their own)
    // INSERT OR REPLACE ensures one rating per user per recipe
    const sql = `
        INSERT OR REPLACE INTO RecipeRatings (recipe_id, user_id, rating, review_text, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    database.run(sql, [recipeId, userId, rating, review || null], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to add rating',
                error: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Rating added successfully'
        });
    });
});

/**
 * Update own rating for a recipe
 * PUT /api/recipes/:id/ratings
 * Requires authentication (user can only update THEIR OWN rating)
 */
router.put('/:id/ratings', authenticate, (req, res) => {
    const recipeId = req.params.id;
    const userId = req.user.user_id;
    const { rating, review } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5'
        });
    }

    // Update only the current user's rating
    const sql = `
        UPDATE RecipeRatings
        SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE recipe_id = ? AND user_id = ?
    `;

    database.run(sql, [rating, review || null, recipeId, userId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update rating',
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found. You must create a rating first.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Rating updated successfully'
        });
    });
});

/**
 * Delete own rating for a recipe
 * DELETE /api/recipes/:id/ratings
 * Requires authentication (user can only delete THEIR OWN rating)
 */
router.delete('/:id/ratings', authenticate, (req, res) => {
    const recipeId = req.params.id;
    const userId = req.user.user_id;

    // Delete only the current user's rating
    const sql = 'DELETE FROM RecipeRatings WHERE recipe_id = ? AND user_id = ?';

    database.run(sql, [recipeId, userId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete rating',
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Rating deleted successfully'
        });
    });
});

/**
 * Get all ratings for a recipe
 * GET /api/recipes/:id/ratings
 * Public route (anyone can view ratings)
 */
router.get('/:id/ratings', (req, res) => {
    const recipeId = req.params.id;

    const sql = `
        SELECT
            rr.rating,
            rr.review_text,
            rr.created_at,
            u.username
        FROM RecipeRatings rr
        JOIN Users u ON rr.user_id = u.user_id
        WHERE rr.recipe_id = ?
        ORDER BY rr.created_at DESC
    `;

    database.all(sql, [recipeId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch ratings',
                error: err.message
            });
        }

        // Calculate average rating
        const avgRating = rows.length > 0
            ? rows.reduce((sum, row) => sum + row.rating, 0) / rows.length
            : 0;

        res.status(200).json({
            success: true,
            data: {
                average_rating: Math.round(avgRating * 10) / 10,
                total_ratings: rows.length,
                ratings: rows
            }
        });
    });
});

module.exports = router;
