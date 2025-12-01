const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to database file
const dbPath = path.join(__dirname, 'recettes.db');

// Delete existing database to start fresh
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Existing database deleted.');
}

// Create new database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});

// Read SQL files
const createTablesSQL = fs.readFileSync(path.join(__dirname, 'create_tables.sql'), 'utf-8');
const userTablesSQL = fs.readFileSync(path.join(__dirname, 'user_tables.sql'), 'utf-8');
const insertDataSQL = fs.readFileSync(path.join(__dirname, 'insert_data.sql'), 'utf-8');

console.log('\n=== Starting Database Setup ===\n');

// Step 1: Create base tables
db.exec(createTablesSQL, (err) => {
    if (err) {
        console.error('Error creating tables:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✓ Base tables created successfully.');

    // Step 2: Add user tables
    db.exec(userTablesSQL, (err) => {
        if (err) {
            console.error('Error creating user tables:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✓ User tables created successfully.');

        // Step 3: Insert sample data
        db.exec(insertDataSQL, (err) => {
            if (err) {
                console.error('Error inserting data:', err.message);
                db.close();
                process.exit(1);
            }
            console.log('✓ Sample data inserted successfully.');

            // Verify tables were created
            db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
                if (err) {
                    console.error('Error listing tables:', err.message);
                } else {
                    console.log('\n=== Database Tables Created ===');
                    tables.forEach(table => {
                        console.log(`  - ${table.name}`);
                    });
                }

                // Close database
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                    } else {
                        console.log('\n✓ Database setup completed successfully!');
                        console.log(`✓ Database file: ${dbPath}\n`);
                    }
                });
            });
        });
    });
});
