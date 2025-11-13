const express = require('express');
const router = express.Router();
const { createStudent, getStudentById, getAllStudents } = require('../controllers/students.controller');
const { createStudentSchema, validate } = require('../validation/students.validation');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/students
 * @desc    Create a new student (for testing - no auth required)
 * @access  Public
 */
router.post('/', validate(createStudentSchema), createStudent);

/**
 * @route   GET /api/students
 * @desc    Get all students
 * @access  Protected
 */
router.get('/', authenticate, getAllStudents);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID with profile and balances
 * @access  Protected
 */
router.get('/:id', authenticate, getStudentById);

module.exports = router;