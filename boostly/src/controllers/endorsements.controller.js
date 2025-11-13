const { runQuery, getOne, getAll } = require('../db/database');

/**
 * Create a new endorsement
 * POST /api/endorsements
 */
const createEndorsement = async (req, res) => {
    try {
        const endorserId = req.userId; // From auth middleware
        const { recognition_id } = req.validatedBody;

        // Check if recognition exists
        const recognition = await getOne(
            'SELECT * FROM recognitions WHERE id = ?',
            [recognition_id]
        );

        if (!recognition) {
            return res.status(404).json({
                success: false,
                error: 'Recognition not found'
            });
        }

        // Prevent self-endorsement
        if (recognition.sender_id === endorserId || recognition.receiver_id === endorserId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot endorse your own recognition (as sender or receiver)'
            });
        }

        // Check if already endorsed (UNIQUE constraint will catch this, but better UX to check first)
        const existingEndorsement = await getOne(
            'SELECT id FROM endorsements WHERE recognition_id = ? AND endorser_id = ?',
            [recognition_id, endorserId]
        );

        if (existingEndorsement) {
            return res.status(409).json({
                success: false,
                error: 'You have already endorsed this recognition'
            });
        }

        // Create endorsement
        const result = await runQuery(
            'INSERT INTO endorsements (recognition_id, endorser_id) VALUES (?, ?)',
            [recognition_id, endorserId]
        );

        // Fetch the created endorsement with details
        const endorsement = await getOne(
            `SELECT 
                e.*,
                s.name as endorser_name,
                r.amount as recognition_amount,
                sender.name as sender_name,
                receiver.name as receiver_name
             FROM endorsements e
             JOIN students s ON e.endorser_id = s.id
             JOIN recognitions r ON e.recognition_id = r.id
             JOIN students sender ON r.sender_id = sender.id
             JOIN students receiver ON r.receiver_id = receiver.id
             WHERE e.id = ?`,
            [result.lastID]
        );

        res.status(201).json({
            success: true,
            message: 'Endorsement created successfully',
            data: endorsement
        });

    } catch (error) {
        console.error('Error creating endorsement:', error);
        
        // Handle UNIQUE constraint violation
        if (error.message.includes('UNIQUE')) {
            return res.status(409).json({
                success: false,
                error: 'You have already endorsed this recognition'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create endorsement'
        });
    }
};

/**
 * Get all endorsements for a recognition
 * GET /api/endorsements/recognition/:recognition_id
 */
const getEndorsementsByRecognition = async (req, res) => {
    try {
        const { recognition_id } = req.params;

        const endorsements = await getAll(
            `SELECT 
                e.*,
                s.name as endorser_name,
                s.email as endorser_email
             FROM endorsements e
             JOIN students s ON e.endorser_id = s.id
             WHERE e.recognition_id = ?
             ORDER BY e.created_at DESC`,
            [recognition_id]
        );

        res.json({
            success: true,
            count: endorsements.length,
            data: endorsements
        });

    } catch (error) {
        console.error('Error fetching endorsements:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch endorsements'
        });
    }
};

/**
 * Get all endorsements by a student
 * GET /api/endorsements/student/:student_id
 */
const getEndorsementsByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;

        const endorsements = await getAll(
            `SELECT 
                e.*,
                r.amount,
                r.message,
                sender.name as sender_name,
                receiver.name as receiver_name
             FROM endorsements e
             JOIN recognitions r ON e.recognition_id = r.id
             JOIN students sender ON r.sender_id = sender.id
             JOIN students receiver ON r.receiver_id = receiver.id
             WHERE e.endorser_id = ?
             ORDER BY e.created_at DESC`,
            [student_id]
        );

        res.json({
            success: true,
            count: endorsements.length,
            data: endorsements
        });

    } catch (error) {
        console.error('Error fetching endorsements:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch endorsements'
        });
    }
};

module.exports = {
    createEndorsement,
    getEndorsementsByRecognition,
    getEndorsementsByStudent
};