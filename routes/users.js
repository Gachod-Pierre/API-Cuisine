const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 * @body    { username, email, password, first_name?, last_name? }
 */
router.post('/register', userController.register);

/**
 * @route   POST /api/users/login
 * @desc    Login user and create session
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', userController.login);

/**
 * @route   GET /api/users
 * @desc    Get all users (for testing only)
 * @access  Public (should be admin-only in production)
 */
router.get('/', userController.getAllUsers);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @route   POST /api/users/logout
 * @desc    Logout user and destroy session
 * @access  Private
 */
router.post('/logout', authenticate, userController.logout);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 * @body    { username?, email?, first_name?, last_name? }
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/profile', authenticate, userController.deleteAccount);

/**
 * @route   PUT /api/users/password
 * @desc    Update user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put('/password', authenticate, userController.updatePassword);

// ============================================
// FAVORITES ROUTES
// ============================================

/**
 * @route   GET /api/users/favorites
 * @desc    Get user's favorite recipes
 * @access  Private
 */
router.get('/favorites', authenticate, userController.getFavorites);

/**
 * @route   POST /api/users/favorites/:recipeId
 * @desc    Add recipe to favorites
 * @access  Private
 */
router.post('/favorites/:recipeId', authenticate, userController.addFavorite);

/**
 * @route   DELETE /api/users/favorites/:recipeId
 * @desc    Remove recipe from favorites
 * @access  Private
 */
router.delete('/favorites/:recipeId', authenticate, userController.removeFavorite);

// ============================================
// RATINGS ROUTES
// ============================================

/**
 * @route   GET /api/users/ratings
 * @desc    Get user's ratings
 * @access  Private
 */
router.get('/ratings', authenticate, userController.getRatings);

module.exports = router;
