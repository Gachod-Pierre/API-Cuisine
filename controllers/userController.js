const User = require('../models/User');

/**
 * Register a new user
 * POST /api/users/register
 */
exports.register = async (req, res, next) => {
    try {
        const { username, email, password, first_name, last_name, is_admin } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUserByEmail = await User.findByEmail(email);
        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const existingUserByUsername = await User.findByUsername(username);
        if (existingUserByUsername) {
            return res.status(409).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Create new user
        const newUser = await User.create({
            username,
            email,
            password,
            first_name,
            last_name,
            is_admin: is_admin || false
        });

        // Create session for the new user
        req.session.user = {
            user_id: newUser.user_id,
            username: newUser.username,
            email: newUser.email,
            is_admin: newUser.is_admin || false
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: newUser.toJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/users/login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password using bcrypt
        const isPasswordValid = await user.verifyPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Create session with user data
        req.session.user = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin || false
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user
 * POST /api/users/logout
 * Requires authentication
 */
exports.logout = async (req, res, next) => {
    try {
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Could not logout. Please try again.'
                });
            }

            // Clear the session cookie
            res.clearCookie('connect.sid');

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/users/profile
 * Requires authentication
 */
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * PUT /api/users/profile
 * Requires authentication
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const { username, email, first_name, last_name } = req.body;

        // Check if username is taken by another user
        if (username) {
            const existingUser = await User.findByUsername(username);
            if (existingUser && existingUser.user_id !== req.user.user_id) {
                return res.status(409).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
        }

        // Check if email is taken by another user
        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.user_id !== req.user.user_id) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        }

        const updatedUser = await User.update(req.user.user_id, {
            username: username || req.user.username,
            email: email || req.user.email,
            first_name,
            last_name
        });

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user password
 * PUT /api/users/password
 * Requires authentication
 */
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Verify current password
        const user = await User.findById(req.user.user_id);
        const isPasswordValid = await user.verifyPassword(currentPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        await User.updatePassword(req.user.user_id, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete user account
 * DELETE /api/users/profile
 * Requires authentication
 */
exports.deleteAccount = async (req, res, next) => {
    try {
        const deleted = await User.delete(req.user.user_id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's favorite recipes
 * GET /api/users/favorites
 * Requires authentication
 */
exports.getFavorites = async (req, res, next) => {
    try {
        const favorites = await User.getFavorites(req.user.user_id);

        res.status(200).json({
            success: true,
            count: favorites.length,
            data: favorites
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add recipe to favorites
 * POST /api/users/favorites/:recipeId
 * Requires authentication
 */
exports.addFavorite = async (req, res, next) => {
    try {
        const recipeId = parseInt(req.params.recipeId);

        // Check if already favorited
        const isFavorited = await User.isFavorited(req.user.user_id, recipeId);
        if (isFavorited) {
            return res.status(409).json({
                success: false,
                message: 'Recipe already in favorites'
            });
        }

        await User.addFavorite(req.user.user_id, recipeId);

        res.status(201).json({
            success: true,
            message: 'Recipe added to favorites'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove recipe from favorites
 * DELETE /api/users/favorites/:recipeId
 * Requires authentication
 */
exports.removeFavorite = async (req, res, next) => {
    try {
        const recipeId = parseInt(req.params.recipeId);

        const removed = await User.removeFavorite(req.user.user_id, recipeId);

        if (!removed) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found in favorites'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recipe removed from favorites'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's ratings
 * GET /api/users/ratings
 * Requires authentication
 */
exports.getRatings = async (req, res, next) => {
    try {
        const ratings = await User.getRatings(req.user.user_id);

        res.status(200).json({
            success: true,
            count: ratings.length,
            data: ratings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users (admin only - for testing)
 * GET /api/users
 */
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll();

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};
