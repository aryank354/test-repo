const { runQuery, getOne, getAll } = require('../db/database');

/**
 * Create a new student
 * POST /api/students
 */
const createStudent = async (req, res) => {
    try {
        const { name, email } = req.validatedBody;

        // Check if email already exists
        const existingStudent = await getOne(
            'SELECT id FROM students WHERE email = ?',
            [email]
        );

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Create student with default balances
        const result = await runQuery(
            `INSERT INTO students (name, email, received_balance, sending_balance, monthly_sending_limit_used)
             VALUES (?, ?, 0, 100, 0)`,
            [name, email]
        );

        // Fetch the created student
        const newStudent = await getOne(
            'SELECT id, name, email, received_balance, sending_balance, monthly_sending_limit_used, created_at FROM students WHERE id = ?',
            [result.lastID]
        );

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: newStudent
        });

    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create student'
        });
    }
};

/**
 * Get student by ID
 * GET /api/students/:id
 */
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await getOne(
            `SELECT 
                id, 
                name, 
                email, 
                received_balance, 
                sending_balance, 
                monthly_sending_limit_used,
                (100 - monthly_sending_limit_used) as remaining_monthly_limit,
                created_at
             FROM students 
             WHERE id = ?`,
            [id]
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        // Get recognition statistics
        const sentStats = await getOne(
            'SELECT COUNT(*) as total_sent, COALESCE(SUM(amount), 0) as total_credits_sent FROM recognitions WHERE sender_id = ?',
            [id]
        );

        const receivedStats = await getOne(
            'SELECT COUNT(*) as total_received, COALESCE(SUM(amount), 0) as total_credits_received FROM recognitions WHERE receiver_id = ?',
            [id]
        );

        const endorsementsGiven = await getOne(
            'SELECT COUNT(*) as total FROM endorsements WHERE endorser_id = ?',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...student,
                statistics: {
                    recognitions_sent: sentStats.total_sent,
                    total_credits_sent: sentStats.total_credits_sent,
                    recognitions_received: receivedStats.total_received,
                    total_credits_received: receivedStats.total_credits_received,
                    endorsements_given: endorsementsGiven.total
                }
            }
        });

    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student'
        });
    }
};

/**
 * Get all students
 * GET /api/students
 */
const getAllStudents = async (req, res) => {
    try {
        const students = await getAll(
            `SELECT 
                id, 
                name, 
                email, 
                received_balance, 
                sending_balance, 
                monthly_sending_limit_used,
                created_at
             FROM students 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            count: students.length,
            data: students
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch students'
        });
    }
};

module.exports = {
    createStudent,
    getStudentById,
    getAllStudents
};