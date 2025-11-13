const { db, getOne, getAll, executeTransaction } = require('../db/database');

/**
 * Create a new redemption (convert credits to rupees)
 * POST /api/redemptions
 * Uses transaction to prevent race conditions
 */
const createRedemption = async (req, res) => {
    try {
        const studentId = req.userId; // From auth middleware
        const { credits_redeemed } = req.validatedBody;

        // Calculate rupees value (5 rupees per credit)
        const rupeesValue = credits_redeemed * 5;

        // Execute the entire operation in a transaction
        const result = await executeTransaction(async () => {
            // 1. Get student's current received balance with row lock
            const student = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT received_balance FROM students WHERE id = ?',
                    [studentId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!student) {
                throw new Error('Student not found');
            }

            // 2. Validate student has enough received balance
            if (student.received_balance < credits_redeemed) {
                throw new Error(`Insufficient received balance. Available: ${student.received_balance} credits`);
            }

            // 3. Update student's received balance
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE students SET received_balance = received_balance - ? WHERE id = ?',
                    [credits_redeemed, studentId],
                    function(err) {
                        if (err) reject(err);
                        else if (this.changes === 0) reject(new Error('Failed to update balance'));
                        else resolve();
                    }
                );
            });

            // 4. Create redemption record
            const redemptionId = await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO redemptions (student_id, credits_redeemed, rupees_value)
                     VALUES (?, ?, ?)`,
                    [studentId, credits_redeemed, rupeesValue],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            return redemptionId;
        });

        // Fetch the created redemption with student details
        const redemption = await getOne(
            `SELECT 
                r.*,
                s.name as student_name,
                s.email as student_email,
                s.received_balance as remaining_balance
             FROM redemptions r
             JOIN students s ON r.student_id = s.id
             WHERE r.id = ?`,
            [result]
        );

        res.status(201).json({
            success: true,
            message: 'Redemption successful',
            data: redemption
        });

    } catch (error) {
        console.error('Error creating redemption:', error);
        
        const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('balance') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to create redemption'
        });
    }
};

/**
 * Get all redemptions for a student
 * GET /api/redemptions/student/:student_id
 */
const getRedemptionsByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;

        const redemptions = await getAll(
            `SELECT 
                r.*,
                s.name as student_name,
                s.email as student_email
             FROM redemptions r
             JOIN students s ON r.student_id = s.id
             WHERE r.student_id = ?
             ORDER BY r.created_at DESC`,
            [student_id]
        );

        // Calculate total redeemed
        const total = redemptions.reduce((sum, r) => sum + r.credits_redeemed, 0);
        const totalRupees = redemptions.reduce((sum, r) => sum + r.rupees_value, 0);

        res.json({
            success: true,
            count: redemptions.length,
            summary: {
                total_credits_redeemed: total,
                total_rupees_value: totalRupees
            },
            data: redemptions
        });

    } catch (error) {
        console.error('Error fetching redemptions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch redemptions'
        });
    }
};

/**
 * Get all redemptions (admin view)
 * GET /api/redemptions
 */
const getAllRedemptions = async (req, res) => {
    try {
        const redemptions = await getAll(
            `SELECT 
                r.*,
                s.name as student_name,
                s.email as student_email
             FROM redemptions r
             JOIN students s ON r.student_id = s.id
             ORDER BY r.created_at DESC`
        );

        // Calculate totals
        const totalCredits = redemptions.reduce((sum, r) => sum + r.credits_redeemed, 0);
        const totalRupees = redemptions.reduce((sum, r) => sum + r.rupees_value, 0);

        res.json({
            success: true,
            count: redemptions.length,
            summary: {
                total_credits_redeemed: totalCredits,
                total_rupees_value: totalRupees
            },
            data: redemptions
        });

    } catch (error) {
        console.error('Error fetching redemptions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch redemptions'
        });
    }
};

/**
 * Get redemption by ID
 * GET /api/redemptions/:id
 */
const getRedemptionById = async (req, res) => {
    try {
        const { id } = req.params;

        const redemption = await getOne(
            `SELECT 
                r.*,
                s.name as student_name,
                s.email as student_email,
                s.received_balance as current_balance
             FROM redemptions r
             JOIN students s ON r.student_id = s.id
             WHERE r.id = ?`,
            [id]
        );

        if (!redemption) {
            return res.status(404).json({
                success: false,
                error: 'Redemption not found'
            });
        }

        res.json({
            success: true,
            data: redemption
        });

    } catch (error) {
        console.error('Error fetching redemption:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch redemption'
        });
    }
};

module.exports = {
    createRedemption,
    getRedemptionsByStudent,
    getAllRedemptions,
    getRedemptionById
};