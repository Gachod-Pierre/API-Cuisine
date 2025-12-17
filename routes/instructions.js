const express = require("express");
const router = express.Router();
const database = require("../config/database").getDB();
const { authenticate, checkRecipeOwnership } = require("../middleware/auth");

// ============================================
// SQL QUERIES ORGANIZED AT TOP
// ============================================

const sql = {
  // GET queries
  getAll: `
        SELECT instruction_id, step_number, description
        FROM RecipeInstructions
        ORDER BY step_number ASC
    `,

  getById: `
        SELECT instruction_id, recipe_id, step_number, description
        FROM RecipeInstructions
        WHERE instruction_id = ?
    `,

  getByRecipeId: `
        SELECT instruction_id, step_number, description
        FROM RecipeInstructions
        WHERE recipe_id = ?
        ORDER BY step_number ASC
    `,

  // POST queries
  create: `
        INSERT INTO RecipeInstructions (recipe_id, step_number, description)
        VALUES (?, ?, ?)
    `,

  // PUT queries
  update: `
        UPDATE RecipeInstructions
        SET description = ?
        WHERE instruction_id = ? AND recipe_id = ?
    `,

  updateStepNumber: `
        UPDATE RecipeInstructions
        SET step_number = ?
        WHERE instruction_id = ? AND recipe_id = ?
    `,

  // DELETE queries
  deleteInstruction: `
        DELETE FROM RecipeInstructions
        WHERE instruction_id = ? AND recipe_id = ?
    `,

  deleteAllByRecipe: `
        DELETE FROM RecipeInstructions
        WHERE recipe_id = ?
    `,

  // Check if instruction exists
  checkExists:
    "SELECT instruction_id FROM RecipeInstructions WHERE instruction_id = ?",

  // Check ownership (verify recipe belongs to user)
  checkRecipeOwnership: "SELECT user_id FROM Recipes WHERE recipe_id = ?",

  // Get max step number for a recipe
  getMaxStepNumber: `
        SELECT MAX(step_number) as max_step
        FROM RecipeInstructions
        WHERE recipe_id = ?
    `,
};

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * Get all instructions for a recipe
 * GET /api/instructions/recipe/:recipeId
 */
router.get("/recipe/:recipeId", (req, res) => {
  const recipeId = req.params.recipeId;

  database.all(sql.getByRecipeId, [recipeId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  });
});

/**
 * Get instruction by ID
 * GET /api/instructions/:id
 */
router.get("/:id", (req, res) => {
  const instructionId = req.params.id;

  database.get(sql.getById, [instructionId], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Instruction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: row,
    });
  });
});

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * Add instruction to recipe
 * POST /api/instructions
 * Requires authentication + recipe ownership (checked by middleware)
 */
router.post("/", authenticate, (req, res) => {
  const { recipe_id, step_number, description } = req.body;
  const userId = req.user.user_id;

  // Validate required fields
  if (!recipe_id || !step_number || !description) {
    return res.status(400).json({
      success: false,
      message: "recipe_id, step_number, and description are required",
    });
  }

  // Validate step_number is a positive integer
  if (!Number.isInteger(step_number) || step_number < 1) {
    return res.status(400).json({
      success: false,
      message: "step_number must be a positive integer",
    });
  }

  // Check if recipe exists and user owns it
  database.get(sql.checkRecipeOwnership, [recipe_id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    // Verify ownership
    if (row.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You do not own this recipe",
      });
    }

    // Insert instruction
    database.run(
      sql.create,
      [recipe_id, step_number, description],
      function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to add instruction",
            error: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: "Instruction added successfully",
          data: {
            instruction_id: this.lastID,
            recipe_id,
            step_number,
            description,
          },
        });
      }
    );
  });
});

/**
 * Add multiple instructions to recipe
 * POST /api/instructions/batch/add
 * Requires authentication + recipe ownership
 * Body: { recipe_id, instructions: [{step_number, description}, ...] }
 */
router.post("/batch/add", authenticate, (req, res) => {
  const { recipe_id, instructions } = req.body;
  const userId = req.user.user_id;

  // Validate required fields
  if (!recipe_id || !Array.isArray(instructions) || instructions.length === 0) {
    return res.status(400).json({
      success: false,
      message: "recipe_id and instructions array (non-empty) are required",
    });
  }

  // Validate instructions format
  for (let i = 0; i < instructions.length; i++) {
    if (!instructions[i].step_number || !instructions[i].description) {
      return res.status(400).json({
        success: false,
        message: `Instruction ${i} must have step_number and description`,
      });
    }
    if (
      !Number.isInteger(instructions[i].step_number) ||
      instructions[i].step_number < 1
    ) {
      return res.status(400).json({
        success: false,
        message: `Instruction ${i} step_number must be a positive integer`,
      });
    }
  }

  // Check if recipe exists and user owns it
  database.get(sql.checkRecipeOwnership, [recipe_id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    // Verify ownership
    if (row.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You do not own this recipe",
      });
    }

    // Insert instructions in a transaction
    const successfulInserts = [];
    let errorOccurred = false;

    instructions.forEach((instruction, index) => {
      if (!errorOccurred) {
        database.run(
          sql.create,
          [recipe_id, instruction.step_number, instruction.description],
          function (err) {
            if (err) {
              errorOccurred = true;
              return res.status(500).json({
                success: false,
                message: `Failed to add instruction ${index + 1}`,
                error: err.message,
              });
            }

            successfulInserts.push({
              instruction_id: this.lastID,
              recipe_id,
              step_number: instruction.step_number,
              description: instruction.description,
            });

            // If all instructions processed, send response
            if (successfulInserts.length === instructions.length) {
              res.status(201).json({
                success: true,
                message: `${successfulInserts.length} instruction(s) added successfully`,
                data: successfulInserts,
              });
            }
          }
        );
      }
    });
  });
});

/**
 * Update instruction
 * PUT /api/instructions/:id/recipe/:recipeId
 * Requires authentication + recipe ownership
 */
router.put("/:id/recipe/:recipeId", authenticate, (req, res) => {
  const instructionId = req.params.id;
  const recipeId = req.params.recipeId;
  const { description } = req.body;
  const userId = req.user.user_id;

  // Validate input
  if (!description) {
    return res.status(400).json({
      success: false,
      message: "Description is required",
    });
  }

  // Check if recipe exists and user owns it
  database.get(sql.checkRecipeOwnership, [recipeId], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    // Verify ownership
    if (row.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You do not own this recipe",
      });
    }

    // Update instruction
    database.run(
      sql.update,
      [description, instructionId, recipeId],
      function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to update instruction",
            error: err.message,
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "Instruction not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Instruction updated successfully",
        });
      }
    );
  });
});

/**
 * Update instruction step number
 * PUT /api/instructions/:id/recipe/:recipeId/step
 * Requires authentication + recipe ownership
 */
router.put("/:id/recipe/:recipeId/step", authenticate, (req, res) => {
  const instructionId = req.params.id;
  const recipeId = req.params.recipeId;
  const { step_number } = req.body;
  const userId = req.user.user_id;

  // Validate input
  if (!Number.isInteger(step_number) || step_number < 1) {
    return res.status(400).json({
      success: false,
      message: "step_number must be a positive integer",
    });
  }

  // Check if recipe exists and user owns it
  database.get(sql.checkRecipeOwnership, [recipeId], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    // Verify ownership
    if (row.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You do not own this recipe",
      });
    }

    // Update step number
    database.run(
      sql.updateStepNumber,
      [step_number, instructionId, recipeId],
      function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to update instruction step number",
            error: err.message,
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "Instruction not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Instruction step number updated successfully",
        });
      }
    );
  });
});

/**
 * Delete instruction
 * DELETE /api/instructions/:id/recipe/:recipeId
 * Requires authentication + recipe ownership
 */
router.delete("/:id/recipe/:recipeId", authenticate, (req, res) => {
  const instructionId = req.params.id;
  const recipeId = req.params.recipeId;
  const userId = req.user.user_id;

  // Check if recipe exists and user owns it
  database.get(sql.checkRecipeOwnership, [recipeId], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    // Verify ownership
    if (row.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You do not own this recipe",
      });
    }

    // Delete instruction
    database.run(
      sql.deleteInstruction,
      [instructionId, recipeId],
      function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to delete instruction",
            error: err.message,
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "Instruction not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Instruction deleted successfully",
        });
      }
    );
  });
});

module.exports = router;
