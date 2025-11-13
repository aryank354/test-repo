const express = require('express');
const router = express.Router();
const { 
    createEndorsement, 
    getEndorsementsByRecognition,
    getEndorsementsByStudent
} = require('../controllers/endorsements.controller');
const { createEndorsementSchema } = require('../validation/endorsements.validation');
const { validate } = require('../validation/students.validation');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/endorsements
 * @desc    Create a new endorsement
 * @access  Protected
 */
router.post('/', authenticate, validate(createEndorsementSchema), createEndorsement);

/**
 * @route   GET /api/endorsements/recognition/:recognition_id
 * @desc    Get all endorsements for a recognition
 * @access  Protected
 */
router.get('/recognition/:recognition_id', authenticate, getEndorsementsByRecognition);

/**
 * @route   GET /api/endorsements/student/:student_id
 * @desc    Get all endorsements by a student
 * @access  Protected
 */
router.get('/student/:student_id', authenticate, getEndorsementsByStudent);

module.exports = router;