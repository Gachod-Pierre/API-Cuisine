const express = require('express');
const router = express.Router();
const database = require('../config/database').getDB();

const sql = {
    // GET queries
    getAll: `
        SELECT allergy_id, name
        FROM AllergiesInformation
        ORDER BY name ASC
    `,
}

/**
 * Get all cuisines
 * GET /api/cuisines
 */
router.get('/', (req, res) => {
    database.all(sql.getAll, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    });
});

module.exports = router;