// Recipe validation middleware
const validateRecipe = (req, res, next) => {
    const { title, description, cuisine_id, goal_id } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Title is required and must be a non-empty string'
        });
    }

    if (!description || typeof description !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Description is required and must be a string'
        });
    }

    if (!cuisine_id || !Number.isInteger(cuisine_id)) {
        return res.status(400).json({
            success: false,
            message: 'Valid cuisine_id is required'
        });
    }

    if (!goal_id || !Number.isInteger(goal_id)) {
        return res.status(400).json({
            success: false,
            message: 'Valid goal_id is required'
        });
    }

    next();
};

// Recipe update validation middleware
const validateRecipeUpdate = (req, res, next) => {
    const { title } = req.body;

    if (title && (typeof title !== 'string' || title.trim().length === 0)) {
        return res.status(400).json({
            success: false,
            message: 'Title must be a non-empty string'
        });
    }

    next();
};

// Cuisine validation middleware
const validateCuisine = (req, res, next) => {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Name is required and must be a non-empty string'
        });
    }

    next();
};

// Ingredient validation middleware
const validateIngredient = (req, res, next) => {
    const { name, quantity, unit } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Name is required and must be a non-empty string'
        });
    }

    if (quantity && typeof quantity !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Quantity must be a string'
        });
    }

    if (unit && typeof unit !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Unit must be a string'
        });
    }

    next();
};

// TODO: Add more validation middlewares as needed
// - validateDietaryInformation
// - validateAllergiesInformation
// - validateGoals
// - validateRecipeIngredients
// - validateRecipeInstructions

module.exports = {
    validateRecipe,
    validateRecipeUpdate,
    validateCuisine,
    validateIngredient
};