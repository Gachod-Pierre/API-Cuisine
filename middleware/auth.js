const jwt = require('jsonwebtoken');

/**
 * Authentication middleware using JWT tokens
 * Checks if user is logged in via JWT token in Authorization header
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Please provide a valid token.'
            });
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

        // Attach user info to request object
        req.user = {
            user_id: decoded.user_id,
            username: decoded.username,
            email: decoded.email,
            is_admin: decoded.is_admin || false
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Please login to continue.'
            });
        }
    }
};

/**
 * Optional authentication middleware
 * Attaches user info if valid token exists, but doesn't block request
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
            
            req.user = {
                user_id: decoded.user_id,
                username: decoded.username,
                email: decoded.email,
                is_admin: decoded.is_admin || false
            };
        } else {
            req.user = null;
        }
    } catch (error) {
        // If token is invalid, just set user to null and continue
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
 * Use after authenticate
 * For future use: admin-only routes (manage all users, moderate content, etc.)
 */
const requireAdmin = (req, res, next) => {
    // Must be authenticated first (should be used after authenticate middleware)
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login to continue.'
        });
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
    authenticate,
    optionalAuth,

    // Ownership middlewares
    checkRecipeOwnership,  // Check if user owns a recipe (for UPDATE/DELETE recipe)
    checkOwnership,  // Generic ownership checker factory (for any resource)

    // Admin middleware (for future use)
    requireAdmin  // Check if user is admin (for admin-only routes)
};
