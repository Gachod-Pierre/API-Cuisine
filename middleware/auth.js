/**
 * Authentication middleware using sessions
 * Checks if user is logged in via session
 */
const authenticateSession = (req, res, next) => {
    // Check if session exists and has user data
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login to continue.'
        });
    }
    // Attach user info to request object
    req.user = req.session.user;
    next();
};

/**
 * Optional authentication middleware
 * Attaches user info if session exists, but doesn't block request
 */
const optionalAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
    } else {
        req.user = null;
    }

    next();
};

/**
 * Middleware to check if user owns a recipe
 * Use after authenticate middleware
 * Checks req.params.id or req.params.recipeId
 * Admins bypass ownership check
 */
const checkRecipeOwnership = (req, res, next) => {
    const database = require('../config/database').getDB();
    const recipeId = req.params.id || req.params.recipeId;
    const userId = req.user.user_id;
    const isAdmin = req.user.is_admin;

    // Admins can modify any recipe
    if (isAdmin) {
        return next();
    }

    const sql = 'SELECT user_id FROM Recipes WHERE recipe_id = ?';

    database.get(sql, [recipeId], (err, row) => {
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
                message: 'Recipe not found'
            });
        }

        if (row.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You can only modify your own recipes'
            });
        }

        // User owns the recipe, continue
        next();
    });
};

/**
 * Generic middleware factory to check ownership of any resource
 * @param {string} tableName - Name of the table (e.g., 'Recipes', 'Cuisines')
 * @param {string} idColumn - Name of the ID column (e.g., 'recipe_id', 'cuisine_id')
 * @param {string} paramName - Name of the route parameter (default: 'id')
 */
const checkOwnership = (tableName, idColumn, paramName = 'id') => {
    return (req, res, next) => {
        const database = require('../config/database').getDB();
        const resourceId = req.params[paramName];
        const userId = req.user.user_id;
        const isAdmin = req.user.is_admin;

        // Admins can modify any resource
        if (isAdmin) {
            return next();
        }

        const sql = `SELECT user_id FROM ${tableName} WHERE ${idColumn} = ?`;

        database.get(sql, [resourceId], (err, row) => {
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
                    message: `${tableName.slice(0, -1)} not found`
                });
            }

            if (row.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: You can only modify your own ${tableName.toLowerCase()}`
                });
            }

            // User owns the resource, continue
            next();
        });
    };
};

/**
 * Middleware to check if user is an admin
 * Use after authenticateSession
 * For future use: admin-only routes (manage all users, moderate content, etc.)
 */
const requireAdmin = (req, res, next) => {
    // Must be authenticated first
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login to continue.'
        });
    }

    // Attach user info if not already done
    if (!req.user) {
        req.user = req.session.user;
    }

    // Check if user is admin
    if (!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden. Admin access required.'
        });
    }

    next();
};

module.exports = {
    // Authentication middlewares
    authenticateSession,
    authenticate: authenticateSession,  // Recommended: Clear, simple alias
    authenticateToken: authenticateSession,  // Deprecated: kept for backward compatibility
    optionalAuth,

    // Ownership middlewares
    checkRecipeOwnership,  // Check if user owns a recipe (for UPDATE/DELETE recipe)
    checkOwnership,  // Generic ownership checker factory (for any resource)

    // Admin middleware (for future use)
    requireAdmin  // Check if user is admin (for admin-only routes)
};
