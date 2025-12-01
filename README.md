# Recipe Website API - Student Setup Guide

Complete guide for setting up and running the Recipe Website API project.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Database Setup](#database-setup)
4. [Starting the Server](#starting-the-server)
5. [Testing the API](#testing-the-api)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### 1. Node.js
- **Version:** 16.0.0 or higher
- **Check version:**
  ```bash
  node --version
  ```
- **Download:** https://nodejs.org/

### 2. npm (comes with Node.js)
- **Check version:**
  ```bash
  npm --version
  ```

### 3. SQLite3 (Optional - Node.js package includes it)
- **Check if available:**
  ```bash
  sqlite3 --version
  ```

### 4. Code Editor (Recommended)
- Visual Studio Code, Sublime Text, or your preferred editor

### 5. Postman (for API testing)
- **Download:** https://www.postman.com/downloads/

---

##  Installation Steps

### Step 1: Extract Project Files

Extract all files to a directory, for example:
```
/Users/yourname/recipe-website-api/
```

### Step 2: Open Terminal

Navigate to the project directory:
```bash
cd /path/to/recipe-website-api
```

### Step 3: Verify All Files Are Present

Check that you have all required files:
```bash
ls -la
```

You should see:
- `app.js`
- `package.json`
- Folders: `config/`, `database/`, `middleware/`, `models/`, `routes/`

### Step 4: Create Environment File

Copy the example environment file:
```bash
cp .env.example .env
```

Or create `.env` manually with this content:
```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./database/recettes.db
SESSION_SECRET=your-secret-key-change-in-production
```

**Important:** Never commit `.env` to Git (it's in `.gitignore`)

### Step 5: Install Dependencies

Install all required npm packages:
```bash
npm install
```

**This will install:**
- express (web framework)
- sqlite3 (database)
- bcryptjs (password hashing)
- express-session (session management)
- dotenv (environment variables)

**Wait for completion** - you should see:
```
added XXX packages in XXs
```

### Step 6: Verify Installation

Check that `node_modules/` folder was created:
```bash
ls -la
```

---

## Database Setup

### Step 1: Navigate to Database Folder

```bash
cd database
```

### Step 2: Run Database Setup Script

```bash
node setup-database.js
```

**Expected Output:**
```
Existing database deleted.

=== Starting Database Setup ===

Connected to SQLite database.
✓ Base tables created successfully.
✓ User tables created successfully.
✓ Sample data inserted successfully.

=== Database Tables Created ===
  - AllergiesInformation
  - Cuisines
  - DietaryInformation
  - Goals
  - Ingredients
  - RecipeIngredients
  - RecipeInstructions
  - RecipeRatings
  - Recipes
  - UserFavorites
  - Users
  - sqlite_sequence

✓ Database setup completed successfully!
✓ Database file: /path/to/database/recettes.db
```

### Step 3: Verify Database Was Created

```bash
ls -lh recettes.db
```

You should see a file that's around 80-100KB.

### Step 4: Return to Project Root

```bash
cd ..
```

---

## Starting the Server

### Option 1: Production Mode

```bash
npm start
```

### Option 2: Development Mode (Auto-restart on changes)

```bash
npm run dev
```

**Expected Output:**
```
Recipe Website API Server Started
Server running on port 3000
API URL: http://localhost:3000
API documentation: http://localhost:3000/
Help page: http://localhost:3000/help

Available endpoints:
   GET  http://localhost:3000/api/recipes
   GET  http://localhost:3000/api/cuisines
   GET  http://localhost:3000/api/ingredients
   POST http://localhost:3000/api/users/register
   POST http://localhost:3000/api/users/login

Connected to SQLite database
```

### Verify Server is Running

Open your browser and go to:
```
http://localhost:3000
```

You should see JSON output with API information.

---

## Testing the API : Using Postman (Recommended)

1. **Import the Collection**
   - Open Postman
   - Click "Import"
   - Select `Recipe_Website_API.postman_collection.json`

2. **Set Up Environment**
   - Create environment: "Recipe API Local"
   - Add variable: `base_url` = `http://localhost:3000`

3. **Start Testing**
   - See `POSTMAN_TESTING_GUIDE.md` for detailed instructions

---

## API Endpoints Overview

### Public Endpoints (No Authentication)

**Recipes**
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `GET /api/recipes/cuisine/:cuisineId` - Get recipes by cuisine
- `GET /api/recipes/goal/:goalId` - Get recipes by goal
- `GET /api/recipes/no-allergens/:allergyId` - Get recipes without allergen
- `GET /api/recipes/:id/ratings` - Get ratings for recipe

**Cuisines**
- `GET /api/cuisines` - Get all cuisines
- `GET /api/cuisines/:id` - Get cuisine by ID

**Ingredients**
- `GET /api/ingredients` - Get all ingredients
- `GET /api/ingredients/:id` - Get ingredient by ID

**Users**
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users` - Get all users (for testing)

### Protected Endpoints (Authentication Required)

**Recipes**
- `GET /api/recipes/my-recipes` - Get my recipes
- `POST /api/recipes` - Create recipe
- `POST /api/recipes/:id/ingredients` - Add ingredient
- `PUT /api/recipes/:id/title` - Update title
- `PUT /api/recipes/:id/allergy` - Update allergy info
- `PUT /api/recipes/:id/instructions/:stepId` - Update instruction
- `DELETE /api/recipes/:id` - Delete recipe
- `DELETE /api/recipes/:id/ingredients/:ingredientId` - Remove ingredient

**Recipe Ratings**
- `POST /api/recipes/:id/ratings` - Add rating
- `PUT /api/recipes/:id/ratings` - Update rating
- `DELETE /api/recipes/:id/ratings` - Delete rating

**Ingredients**
- `POST /api/ingredients` - Create ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

**User Profile**
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password
- `DELETE /api/users/profile` - Delete account
- `POST /api/users/logout` - Logout

### Admin-Only Endpoints

**Cuisines**
- `POST /api/cuisines` - Create cuisine
- `PUT /api/cuisines/:id` - Update cuisine
- `DELETE /api/cuisines/:id` - Delete cuisine

---

## Important Notes

### Session-Based Authentication

- This API uses **session cookies**, not JWT tokens
- After login, session cookie is automatically sent with requests
- Session lasts 24 hours
- Logout destroys the session

### Admin Users

- Regular users: `"is_admin": false` (default)
- Admin users: `"is_admin": true` (must be set during registration)
- Only admins can create/update/delete cuisines

### Database

- SQLite database (single file)
- Located at `database/recettes.db`
- Can be deleted and recreated anytime
- No separate database server needed



