-- ============================================
-- USER TABLES FOR RECIPE WEBSITE
-- ============================================

-- Table "Users" (Utilisateurs)
CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_admin INTEGER DEFAULT 0
);

-- Table "UserFavorites" (Recettes Favorites des Utilisateurs)
-- Junction table for users to save favorite recipes
CREATE TABLE UserFavorites (
    user_id INTEGER,
    recipe_id INTEGER,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

-- Table "RecipeRatings" (Évaluations des Recettes)
-- Users can rate recipes from 1 to 5 stars
CREATE TABLE RecipeRatings (
    rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

-- Add index for faster queries on ratings
CREATE INDEX idx_recipe_ratings ON RecipeRatings(recipe_id);
CREATE INDEX idx_user_favorites ON UserFavorites(user_id);

-- ============================================
-- UPDATE EXISTING RECIPES TABLE
-- ============================================
-- Note: Run this AFTER creating the Users table
-- This adds the user_id (recipe creator) to the Recipes table

-- Step 1: Add user_id column (allowing NULL for existing recipes)
ALTER TABLE Recipes ADD COLUMN user_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL;

-- Step 2: Add rating statistics columns
ALTER TABLE Recipes ADD COLUMN average_rating REAL DEFAULT 0;
ALTER TABLE Recipes ADD COLUMN total_ratings INTEGER DEFAULT 0;

-- Step 3: Create index for faster queries
CREATE INDEX idx_recipe_user ON Recipes(user_id);

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample users (password is 'password123' hashed with bcrypt)
-- Note: These are example hashes - in production, hash passwords properly!
INSERT INTO Users (username, email, password_hash, first_name, last_name) VALUES
('john_doe', 'john@example.com', '$2b$10$rQ8HqUqJ9Z3KvGQHZhYgN.ZYF3xhvVzxhPJXqHqHqHqHqHqHqHqHq', 'John', 'Doe'),
('jane_smith', 'jane@example.com', '$2b$10$rQ8HqUqJ9Z3KvGQHZhYgN.ZYF3xhvVzxhPJXqHqHqHqHqHqHqHqHq', 'Jane', 'Smith'),
('chef_mike', 'mike@example.com', '$2b$10$rQ8HqUqJ9Z3KvGQHZhYgN.ZYF3xhvVzxhPJXqHqHqHqHqHqHqHqHq', 'Mike', 'Johnson');

-- Note: To properly hash passwords, use bcrypt in your Node.js code:
-- const bcrypt = require('bcryptjs');
-- const hashedPassword = await bcrypt.hash('password123', 10);
