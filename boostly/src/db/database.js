const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database connection
const db = new sqlite3.Database('./boostly.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✓ Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
        console.error('Error enabling foreign keys:', err.message);
    } else {
        console.log('✓ Foreign keys enabled');
    }
});

/**
 * Initialize database with schema
 */
const initDb = () => {
    return new Promise((resolve, reject) => {
        const schemaPath = path.join(__dirname, 'schema.sql');
        
        fs.readFile(schemaPath, 'utf8', (err, schema) => {
            if (err) {
                console.error('Error reading schema file:', err.message);
                return reject(err);
            }

            // Execute schema using serialize to ensure sequential execution
            db.serialize(() => {
                db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error executing schema:', err.message);
                        return reject(err);
                    }
                    console.log('✓ Database schema initialized');
                    resolve();
                });
            });
        });
    });
};

/**
 * Helper function to run queries with promises
 */
const runQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

/**
 * Helper function to get a single row
 */
const getOne = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

/**
 * Helper function to get all rows
 */
const getAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

/**
 * Execute a transaction with rollback support
 */
const executeTransaction = (callback) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    return reject(err);
                }

                callback()
                    .then((result) => {
                        db.run('COMMIT', (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return reject(err);
                            }
                            resolve(result);
                        });
                    })
                    .catch((error) => {
                        db.run('ROLLBACK', () => {
                            reject(error);
                        });
                    });
            });
        });
    });
};

module.exports = {
    db,
    initDb,
    runQuery,
    getOne,
    getAll,
    executeTransaction
};