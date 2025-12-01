-- Table "Cuisines" (Cuisines)
CREATE TABLE Cuisines (
    cuisine_id INTEGER PRIMARY KEY,
    name TEXT
);

-- Table "Goals" (Objectifs)
CREATE TABLE Goals (
    goal_id INTEGER PRIMARY KEY,
    name TEXT
);

-- Table "DietaryInformation" (Informations Diététiques)
CREATE TABLE DietaryInformation (
    diet_id INTEGER PRIMARY KEY,
    name TEXT
);

-- Table "AllergiesInformation" (Informations sur les Allergies)
CREATE TABLE AllergiesInformation (
    allergy_id INTEGER PRIMARY KEY,
    name TEXT
);

-- Table "Ingredients" (Ingrédients)
CREATE TABLE Ingredients (
    ingredient_id INTEGER PRIMARY KEY,
    name TEXT,
    unit TEXT
);

-- Table "Recipes" (Recettes)
CREATE TABLE Recipes (
    recipe_id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    image_url TEXT,
    cuisine_id INTEGER,
    goal_id INTEGER,
    DietaryInformation_id INTEGER,
    AllergiesInformation_id INTEGER,
    FOREIGN KEY (cuisine_id) REFERENCES Cuisines(cuisine_id),
    FOREIGN KEY (goal_id) REFERENCES Goals(goal_id),
    FOREIGN KEY (DietaryInformation_id) REFERENCES DietaryInformation(diet_id),
    FOREIGN KEY (AllergiesInformation_id) REFERENCES AllergiesInformation(allergy_id)
);

-- Table "RecipeIngredients" (Table de liaison pour les ingrédients de la recette)
CREATE TABLE RecipeIngredients (
    recipe_id INTEGER,
    ingredient_id INTEGER,
    quantity REAL,
    PRIMARY KEY (recipe_id, ingredient_id),
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id),
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
);

-- Table "RecipeInstructions" (Instructions de la Recette)
CREATE TABLE RecipeInstructions (
    instruction_id INTEGER PRIMARY KEY,
    recipe_id INTEGER,
    step_number INTEGER,
    description TEXT,
    ingredient_id INTEGER,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id),
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
);

-- ============================================
-- OPTIONAL: USER FUNCTIONALITY
-- ============================================
-- To add user authentication, favorites, and ratings:
-- Run the user_tables.sql file AFTER this file
--
-- sqlite3 recettes.db < database/user_tables.sql
--
-- This will add:
-- - Users table (authentication with username/email/password)
-- - UserFavorites table (users can save favorite recipes)
-- - RecipeRatings table (users can rate recipes 1-5 stars)
-- - Update Recipes table with user_id (track recipe creator)
-- - Add average_rating and total_ratings to Recipes table