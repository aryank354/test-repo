const { db, getOne, getAll, executeTransaction } = require('../db/database');

/**
 * Create a new recognition (transfer credits)
 * POST /api/recognitions
 * CRITICAL: Uses database transaction to prevent race conditions
 */
const createRecognition = async (req, res) => {
    try {
        const senderId = req.userId; // From auth middleware
        const { receiver_id, amount, message } = req.validatedBody;

        // Validate sender is not recognizing themselves
        if (senderId === receiver_id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot send recognition to yourself'
            });
        }

        // Execute the entire operation in a transaction
        const result = await executeTransaction(async () => {
            // 1. Check if receiver exists
            const receiver = await getOne(
                'SELECT id FROM students WHERE id = ?',
                [receiver_id]
            );

            if (!receiver) {
                throw new Error('Receiver not found');
            }

            // 2. Get sender's current balances with row lock
            const sender = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT sending_balance, monthly_sending_limit_used FROM students WHERE id = ?',
                    [senderId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!sender) {
                throw new Error('Sender not found');
            }

            // 3. Validate sender has enough balance
            if (sender.sending_balance < amount) {
                throw new Error(`Insufficient sending balance. Available: ${sender.sending_balance} credits`);
            }

            // 4. Validate monthly limit (100 credits per month)
            const newMonthlyUsed = sender.monthly_sending_limit_used + amount;
            if (newMonthlyUsed > 100) {
                const remaining = 100 - sender.monthly_sending_limit_used;
                throw new Error(`Monthly sending limit exceeded. Remaining: ${remaining} credits`);
            }

            // 5. Update sender's balances
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE students 
                     SET sending_balance = sending_balance - ?,
                         monthly_sending_limit_used = monthly_sending_limit_used + ?
                     WHERE id = ?`,
                    [amount, amount, senderId],
                    function(err) {
                        if (err) reject(err);
                        else if (this.changes === 0) reject(new Error('Failed to update sender'));
                        else resolve();
                    }
                );
            });

            // 6. Update receiver's received balance
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE students SET received_balance = received_balance + ? WHERE id = ?',
                    [amount, receiver_id],
                    function(err) {
                        if (err) reject(err);
                        else if (this.changes === 0) reject(new Error('Failed to update receiver'));
                        else resolve();
                    }
                );
            });

            // 7. Create recognition record
            const recognitionId = await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO recognitions (sender_id, receiver_id, amount, message)
                     VALUES (?, ?, ?, ?)`,
                    [senderId, receiver_id, amount, message || null],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            return recognitionId;
        });

        // Fetch the created recognition with sender and receiver details
        const recognition = await getOne(
            `SELECT 
                r.*,
                s.name as sender_name,
                rec.name as receiver_name
             FROM recognitions r
             JOIN students s ON r.sender_id = s.id
             JOIN students rec ON r.receiver_id = rec.id
             WHERE r.id = ?`,
            [result]
        );

        res.status(201).json({
            success: true,
            message: 'Recognition created successfully',
            data: recognition
        });

    } catch (error) {
        console.error('Error creating recognition:', error);
        
        // Send appropriate error message
        const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('balance') || error.message.includes('limit') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to create recognition'
        });
    }
};

/**
 * Get all recognitions (with optional filters)
 * GET /api/recognitions
 */
const getAllRecognitions = async (req, res) => {
    try {
        const { sender_id, receiver_id } = req.query;
        
        let query = `
            SELECT 
                r.*,
                s.name as sender_name,
                rec.name as receiver_name,
                (SELECT COUNT(*) FROM endorsements WHERE recognition_id = r.id) as endorsement_count
            FROM recognitions r
            JOIN students s ON r.sender_id = s.id
            JOIN students rec ON r.receiver_id = rec.id
            WHERE 1=1
        `;
        const params = [];

        if (sender_id) {
            query += ' AND r.sender_id = ?';
            params.push(sender_id);
        }

        if (receiver_id) {
            query += ' AND r.receiver_id = ?';
            params.push(receiver_id);
        }

        query += ' ORDER BY r.created_at DESC';

        const recognitions = await getAll(query, params);

        res.json({
            success: true,
            count: recognitions.length,
            data: recognitions
        });

    } catch (error) {
        console.error('Error fetching recognitions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recognitions'
        });
    }
};

/**
 * Get recognition by ID
 * GET /api/recognitions/:id
 */
const getRecognitionById = async (req, res) => {
    try {
        const { id } = req.params;

        const recognition = await getOne(
            `SELECT 
                r.*,
                s.name as sender_name,
                s.email as sender_email,
                rec.name as receiver_name,
                rec.email as receiver_email,
                (SELECT COUNT(*) FROM endorsements WHERE recognition_id = r.id) as endorsement_count
             FROM recognitions r
             JOIN students s ON r.sender_id = s.id
             JOIN students rec ON r.receiver_id = rec.id
             WHERE r.id = ?`,
            [id]
        );

        if (!recognition) {
            return res.status(404).json({
                success: false,
                error: 'Recognition not found'
            });
        }

        // Get endorsers
        const endorsers = await getAll(
            `SELECT 
                e.id as endorsement_id,
                e.created_at,
                s.id as endorser_id,
                s.name as endorser_name
             FROM endorsements e
             JOIN students s ON e.endorser_id = s.id
             WHERE e.recognition_id = ?
             ORDER BY e.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...recognition,
                endorsers
            }
        });

    } catch (error) {
        console.error('Error fetching recognition:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recognition'
        });
    }
};

module.exports = {
    createRecognition,
    getAllRecognitions,
    getRecognitionById
};