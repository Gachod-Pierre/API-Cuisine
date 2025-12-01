# Postman Testing Guide - Recipe Website API

Complete guide for testing all API endpoints using Postman.

## Table of Contents
1. [Setup](#setup)
2. [Authentication](#authentication)
3. [Testing Users Endpoints](#users-endpoints)
4. [Testing Cuisines Endpoints](#cuisines-endpoints)
5. [Testing Ingredients Endpoints](#ingredients-endpoints)
6. [Testing Recipes Endpoints](#recipes-endpoints)

---

## Setup

### 1. Start Your Server
```bash
npm start
# or for development mode
npm run dev
```

Server will run on: `http://localhost:3000`

### 2. Configure Postman

1. Open Postman
2. Create a new Collection called "Recipe Website API"
3. Set up an environment variable:
   - Variable: `base_url`
   - Value: `http://localhost:3000`

### 3. Enable Cookie/Session Support

**IMPORTANT:** Since the API uses session-based authentication, you need to configure Postman to handle cookies:

1. Go to Settings (⚙️ icon) → General
2. Enable "Automatically follow redirects"
3. Enable "Send cookies"
4. For each authenticated request, cookies will be automatically managed

---

## Authentication

The API uses **session-based authentication**. After logging in, the session cookie is automatically stored and sent with subsequent requests.

### Flow:
1. Register a new user (or use existing)
2. Login to get session cookie
3. Session cookie is automatically sent with all requests
4. Logout to destroy session

---

## Users Endpoints

### 1. Register New User

**Endpoint:** `POST {{base_url}}/api/users/register`

**Body (JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "first_name": "Test",
  "last_name": "User"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

---

### 2. Register Admin User

**Endpoint:** `POST {{base_url}}/api/users/register`

**Body (JSON):**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "first_name": "Admin",
  "last_name": "User",
  "is_admin": true
}
```

**Note:** This creates an admin user needed for testing cuisine endpoints (POST, PUT, DELETE).

---

### 3. Login

**Endpoint:** `POST {{base_url}}/api/users/login`

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "is_admin": false
  }
}
```

**Important:** Session cookie is automatically stored by Postman.

---

### 4. Get All Users

**Endpoint:** `GET {{base_url}}/api/users`

**No authentication required**

---

### 5. Get User Profile

**Endpoint:** `GET {{base_url}}/api/users/profile`

**Authentication:** Required (must be logged in)

---

### 6. Update Profile

**Endpoint:** `PUT {{base_url}}/api/users/profile`

**Authentication:** Required

**Body (JSON):**
```json
{
  "username": "updateduser",
  "first_name": "Updated",
  "last_name": "Name"
}
```

---

### 7. Update Password

**Endpoint:** `PUT {{base_url}}/api/users/password`

**Authentication:** Required

**Body (JSON):**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

---

### 8. Logout

**Endpoint:** `POST {{base_url}}/api/users/logout`

**Authentication:** Required

---

### 9. Delete Account

**Endpoint:** `DELETE {{base_url}}/api/users/profile`

**Authentication:** Required

---

## Cuisines Endpoints

### 1. Get All Cuisines

**Endpoint:** `GET {{base_url}}/api/cuisines`

**No authentication required**

**Expected Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "cuisine_id": 1,
      "name": "French"
    },
    {
      "cuisine_id": 2,
      "name": "Italian"
    }
  ]
}
```

---

### 2. Get Cuisine by ID

**Endpoint:** `GET {{base_url}}/api/cuisines/1`

**No authentication required**

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "cuisine_id": 1,
    "name": "French",
    "recipes": [
      {
        "recipe_id": 1,
        "title": "Ratatouille",
        "description": "Classic French dish",
        "image_url": "..."
      }
    ],
    "recipe_count": 1
  }
}
```

---

### 3. Create New Cuisine (ADMIN ONLY)

**Endpoint:** `POST {{base_url}}/api/cuisines`

**Authentication:** Required (Admin only)

**Important:** You must login as admin first!

**Body (JSON):**
```json
{
  "name": "Japanese"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Cuisine created successfully",
  "data": {
    "cuisine_id": 6,
    "name": "Japanese"
  }
}
```

**Error if not admin (403):**
```json
{
  "success": false,
  "message": "Forbidden. Admin access required."
}
```

---

### 4. Update Cuisine (ADMIN ONLY)

**Endpoint:** `PUT {{base_url}}/api/cuisines/6`

**Authentication:** Required (Admin only)

**Body (JSON):**
```json
{
  "name": "Japanese Cuisine"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Cuisine updated successfully",
  "data": {
    "cuisine_id": 6,
    "name": "Japanese Cuisine"
  }
}
```

---

### 5. Delete Cuisine (ADMIN ONLY)

**Endpoint:** `DELETE {{base_url}}/api/cuisines/6`

**Authentication:** Required (Admin only)

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Cuisine deleted successfully"
}
```

**Error if cuisine is used by recipes (409):**
```json
{
  "success": false,
  "message": "Cannot delete cuisine: It is used by existing recipes. Please remove or update those recipes first."
}
```

---

## Ingredients Endpoints

### 1. Get All Ingredients

**Endpoint:** `GET {{base_url}}/api/ingredients`

**No authentication required**

**Expected Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "ingredient_id": 1,
      "name": "Tomato",
      "unit": "piece"
    },
    {
      "ingredient_id": 2,
      "name": "Flour",
      "unit": "gram"
    }
  ]
}
```

---

### 2. Get Ingredient by ID

**Endpoint:** `GET {{base_url}}/api/ingredients/1`

**No authentication required**

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "ingredient_id": 1,
    "name": "Tomato",
    "unit": "piece",
    "recipes": [
      {
        "recipe_id": 1,
        "title": "Ratatouille",
        "description": "Classic French dish",
        "image_url": "...",
        "quantity": 5
      }
    ],
    "recipe_count": 1
  }
}
```

---

### 3. Create New Ingredient

**Endpoint:** `POST {{base_url}}/api/ingredients`

**Authentication:** Required (any logged-in user)

**Body (JSON):**
```json
{
  "name": "Basil",
  "unit": "gram"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Ingredient created successfully",
  "data": {
    "ingredient_id": 11,
    "name": "Basil",
    "unit": "gram"
  }
}
```

---

### 4. Update Ingredient

**Endpoint:** `PUT {{base_url}}/api/ingredients/11`

**Authentication:** Required (any logged-in user)

**Body (JSON):**
```json
{
  "name": "Fresh Basil",
  "unit": "bunch"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Ingredient updated successfully",
  "data": {
    "ingredient_id": 11,
    "name": "Fresh Basil",
    "unit": "bunch"
  }
}
```

---

### 5. Delete Ingredient

**Endpoint:** `DELETE {{base_url}}/api/ingredients/11`

**Authentication:** Required (any logged-in user)

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Ingredient deleted successfully"
}
```

**Error if ingredient is used by recipes (409):**
```json
{
  "success": false,
  "message": "Cannot delete ingredient: It is used by existing recipes. Please remove it from those recipes first."
}
```

---

## Recipes Endpoints

### 1. Get All Recipes

**Endpoint:** `GET {{base_url}}/api/recipes`

**No authentication required**

**Expected Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "recipe_id": 1,
      "title": "Ratatouille",
      "description": "Classic French vegetable stew",
      "image_url": "...",
      "cuisine_name": "French",
      "goal_name": "Healthy Eating",
      "diet_name": "Vegetarian",
      "allergy_name": null
    }
  ]
}
```

---

### 2. Get Recipe by ID

**Endpoint:** `GET {{base_url}}/api/recipes/1`

**No authentication required**

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "recipe_id": 1,
    "title": "Ratatouille",
    "description": "Classic French vegetable stew",
    "image_url": "...",
    "cuisine_name": "French",
    "goal_name": "Healthy Eating",
    "diet_name": "Vegetarian",
    "allergy_name": null,
    "ingredients": [
      {
        "ingredient_id": 1,
        "name": "Tomato",
        "unit": "piece",
        "quantity": 5
      }
    ],
    "instructions": [
      {
        "instruction_id": 1,
        "step_number": 1,
        "description": "Chop the vegetables"
      }
    ]
  }
}
```

---

### 3. Get My Recipes (Logged-in User's Recipes)

**Endpoint:** `GET {{base_url}}/api/recipes/my-recipes`

**Authentication:** Required (any logged-in user)

**Description:** Returns all recipes created by the currently logged-in user

**Expected Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "recipe_id": 5,
      "title": "My Amazing Recipe",
      "description": "A recipe I created",
      "image_url": "...",
      "cuisine_name": "Italian",
      "goal_name": "Healthy Eating",
      "diet_name": "Vegetarian",
      "allergy_name": null,
      "average_rating": 4.5,
      "total_ratings": 10
    },
    {
      "recipe_id": 3,
      "title": "Another Recipe",
      "description": "My second recipe",
      "image_url": "...",
      "cuisine_name": "French",
      "goal_name": "Weight Loss",
      "diet_name": null,
      "allergy_name": null,
      "average_rating": 0,
      "total_ratings": 0
    }
  ]
}
```

**If no recipes created yet:**
```json
{
  "success": true,
  "count": 0,
  "data": [],
  "message": "You have not created any recipes yet"
}
```

**Notes:**
- Recipes are sorted by recipe ID (newest first)
- Includes average rating and total number of ratings for each recipe
- Automatically uses the logged-in user's ID from session
- No need to specify user ID in the URL

---

### 4. Get Recipes by Cuisine

**Endpoint:** `GET {{base_url}}/api/recipes/cuisine/1`

**No authentication required**

---

### 5. Get Recipes by Goal

**Endpoint:** `GET {{base_url}}/api/recipes/goal/1`

**No authentication required**

---

### 6. Get Recipes Without Allergen

**Endpoint:** `GET {{base_url}}/api/recipes/no-allergens/2`

**No authentication required**

---

### 7. Create New Recipe

**Endpoint:** `POST {{base_url}}/api/recipes`

**Authentication:** Required (any logged-in user)

**Body (JSON):**
```json
{
  "title": "Spaghetti Carbonara",
  "description": "Classic Italian pasta dish",
  "image_url": "https://example.com/carbonara.jpg",
  "cuisine_id": 2,
  "goal_id": 1,
  "DietaryInformation_id": 1,
  "AllergiesInformation_id": null
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Recipe created successfully",
  "data": {
    "recipe_id": 6,
    "title": "Spaghetti Carbonara",
    "description": "Classic Italian pasta dish",
    "user_id": 1
  }
}
```

---

### 8. Add Ingredient to Recipe

**Endpoint:** `POST {{base_url}}/api/recipes/6/ingredients`

**Authentication:** Required

**Body (JSON):**
```json
{
  "ingredient_id": 2,
  "quantity": 400
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Ingredient added to recipe"
}
```

---

### 9. Update Recipe Title

**Endpoint:** `PUT {{base_url}}/api/recipes/6/title`

**Authentication:** Required (must own recipe or be admin)

**Body (JSON):**
```json
{
  "title": "Authentic Spaghetti Carbonara"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Recipe title updated successfully"
}
```

---

### 10. Update Recipe Allergy Info

**Endpoint:** `PUT {{base_url}}/api/recipes/6/allergy`

**Authentication:** Required (must own recipe or be admin)

**Body (JSON):**
```json
{
  "AllergiesInformation_id": 3
}
```

---

### 11. Update Recipe Instruction

**Endpoint:** `PUT {{base_url}}/api/recipes/6/instructions/1`

**Authentication:** Required (must own recipe or be admin)

**Body (JSON):**
```json
{
  "description": "Boil pasta in salted water until al dente"
}
```

---

### 12. Delete Recipe

**Endpoint:** `DELETE {{base_url}}/api/recipes/6`

**Authentication:** Required (must own recipe or be admin)

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

---

### 13. Remove Ingredient from Recipe

**Endpoint:** `DELETE {{base_url}}/api/recipes/6/ingredients/2`

**Authentication:** Required (must own recipe or be admin)

---

### 14. Add Rating to Recipe

**Endpoint:** `POST {{base_url}}/api/recipes/1/ratings`

**Authentication:** Required

**Body (JSON):**
```json
{
  "rating": 5,
  "review": "Amazing recipe! Best ratatouille ever."
}
```

---

### 15. Update Own Rating

**Endpoint:** `PUT {{base_url}}/api/recipes/1/ratings`

**Authentication:** Required

**Body (JSON):**
```json
{
  "rating": 4,
  "review": "Good recipe, but needed more salt."
}
```

---

### 16. Delete Own Rating

**Endpoint:** `DELETE {{base_url}}/api/recipes/1/ratings`

**Authentication:** Required

---

### 17. Get All Ratings for Recipe

**Endpoint:** `GET {{base_url}}/api/recipes/1/ratings`

**No authentication required**

---

## Testing Workflow

### Recommended Testing Order:

1. **Setup Phase**
   - Start server
   - Test `GET /` to verify server is running
   - Test `GET /api/users` to see existing users

2. **User Registration & Authentication**
   - Register regular user
   - Register admin user
   - Login as regular user
   - Test authenticated endpoints (profile, etc.)
   - Logout
   - Login as admin

3. **Test Cuisines (as Admin)**
   - Get all cuisines
   - Get cuisine by ID
   - Create new cuisine
   - Update cuisine
   - Delete cuisine

4. **Test Ingredients (as Regular User)**
   - Get all ingredients
   - Get ingredient by ID
   - Create new ingredient
   - Update ingredient
   - Delete ingredient

5. **Test Recipes**
   - Get all recipes
   - Get recipe by ID
   - Get my recipes (logged-in user's recipes)
   - Create new recipe (as logged-in user)
   - Add ingredients to recipe
   - Update recipe title
   - Add rating to recipe
   - Get ratings for recipe
   - Delete recipe

6. **Test User Favorites**
   - Add recipe to favorites
   - Get favorites
   - Remove from favorites

---

## Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input/missing required fields
- **401 Unauthorized** - Not logged in
- **403 Forbidden** - Logged in but insufficient permissions (e.g., not admin)
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Cannot delete due to foreign key constraint
- **500 Internal Server Error** - Server-side error

---

## Troubleshooting

### Session/Cookie Issues

If authenticated requests return 401:
1. Make sure you logged in successfully first
2. Check that Postman is set to automatically manage cookies
3. Try logging in again
4. Check the "Cookies" tab in Postman to see if session cookie exists

### Admin Access Required

If you get "Forbidden. Admin access required":
1. Logout current user
2. Login as admin user (registered with `is_admin: true`)
3. Try the request again

### Foreign Key Constraint Errors

If you can't delete a cuisine/ingredient:
- The resource is being used by recipes
- Either delete the recipes first, or update them to use a different cuisine/ingredient

---

## Tips

1. **Create a Collection**: Organize all requests in a Postman collection for easy testing
2. **Use Environment Variables**: Set `{{base_url}}` to easily switch between environments
3. **Save Example Responses**: Save successful responses as examples in Postman
4. **Test Error Cases**: Try sending invalid data to test validation
5. **Keep Admin Session**: Keep a separate Postman window logged in as admin for cuisine testing

---

## Next Steps

1. Create your Postman collection with all these endpoints
2. Test each endpoint systematically
3. Document any issues you find
4. Test edge cases (invalid IDs, missing fields, etc.)
5. Test the complete user flow from registration to creating recipes

Happy Testing!
