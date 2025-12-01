const database = require('../config/database').getDB();
const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        this.user_id = data.user_id;
        this.username = data.username;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.is_admin = data.is_admin || 0;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Get user without password hash (safe for API responses)
     */
    toJSON() {
        const { password_hash, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }

    /**
     * Find all users
     */
    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM Users ORDER BY created_at DESC';

            database.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const users = rows.map(row => new User(row));
                    resolve(users.map(user => user.toJSON()));
                }
            });
        });
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM Users WHERE user_id = ?';

            database.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(new User(row));
                }
            });
        });
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM Users WHERE email = ?';

            database.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(new User(row));
                }
            });
        });
    }

    /**
     * Find user by username
     */
    static async findByUsername(username) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM Users WHERE username = ?';

            database.get(sql, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(new User(row));
                }
            });
        });
    }

    /**
     * Create a new user
     */
    static async create(userData) {
        return new Promise(async (resolve, reject) => {
            try {
                // Hash password
                const hashedPassword = await bcrypt.hash(userData.password, 10);

                const sql = `
                    INSERT INTO Users (username, email, password_hash, first_name, last_name, is_admin)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                database.run(
                    sql,
                    [
                        userData.username,
                        userData.email,
                        hashedPassword,
                        userData.first_name || null,
                        userData.last_name || null,
                        userData.is_admin || 0
                    ],
                    function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            // Return newly created user
                            User.findById(this.lastID)
                                .then(user => resolve(user))
                                .catch(err => reject(err));
                        }
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Update user information
     */
    static async update(id, userData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE Users
                SET username = ?, email = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;

            database.run(
                sql,
                [userData.username, userData.email, userData.first_name, userData.last_name, id],
                function (err) {
                    if (err) {
                        reject(err);
                    } else if (this.changes === 0) {
                        resolve(null);
                    } else {
                        User.findById(id)
                            .then(user => resolve(user))
                            .catch(err => reject(err));
                    }
                }
            );
        });
    }

    /**
     * Update user password
     */
    static async updatePassword(id, newPassword) {
        return new Promise(async (resolve, reject) => {
            try {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                const sql = 'UPDATE Users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';

                database.run(sql, [hashedPassword, id], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.changes > 0);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Delete user
     */
    static async delete(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM Users WHERE user_id = ?';

            database.run(sql, [id], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    /**
     * Verify password
     */
    async verifyPassword(password) {
        return await bcrypt.compare(password, this.password_hash);
    }

    /**
     * Get user's favorite recipes
     */
    static async getFavorites(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, c.name as cuisine_name, g.name as goal_name,
                       uf.added_at as favorited_at
                FROM UserFavorites uf
                JOIN Recipes r ON uf.recipe_id = r.recipe_id
                LEFT JOIN Cuisines c ON r.cuisine_id = c.cuisine_id
                LEFT JOIN Goals g ON r.goal_id = g.goal_id
                WHERE uf.user_id = ?
                ORDER BY uf.added_at DESC
            `;

            database.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Add recipe to favorites
     */
    static async addFavorite(userId, recipeId) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO UserFavorites (user_id, recipe_id) VALUES (?, ?)';

            database.run(sql, [userId, recipeId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    /**
     * Remove recipe from favorites
     */
    static async removeFavorite(userId, recipeId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM UserFavorites WHERE user_id = ? AND recipe_id = ?';

            database.run(sql, [userId, recipeId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    /**
     * Check if recipe is favorited by user
     */
    static async isFavorited(userId, recipeId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT 1 FROM UserFavorites WHERE user_id = ? AND recipe_id = ?';

            database.get(sql, [userId, recipeId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row);
                }
            });
        });
    }

    /**
     * Get user's ratings
     */
    static async getRatings(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT rr.*, r.title as recipe_title
                FROM RecipeRatings rr
                JOIN Recipes r ON rr.recipe_id = r.recipe_id
                WHERE rr.user_id = ?
                ORDER BY rr.created_at DESC
            `;

            database.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = User;
