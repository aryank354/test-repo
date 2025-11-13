const express = require('express');
const router = express.Router();
const { 
    createRecognition, 
    getAllRecognitions, 
    getRecognitionById 
} = require('../controllers/recognitions.controller');
const { createRecognitionSchema } = require('../validation/recognitions.validation');
const { validate } = require('../validation/students.validation');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/recognitions
 * @desc    Create a new recognition (transfer credits)
 * @access  Protected
 */
router.post('/', authenticate, validate(createRecognitionSchema), createRecognition);

/**
 * @route   GET /api/recognitions
 * @desc    Get all recognitions (with optional filters)
 * @access  Protected
 */
router.get('/', authenticate, getAllRecognitions);

/**
 * @route   GET /api/recognitions/:id
 * @desc    Get recognition by ID with endorsements
 * @access  Protected
 */
router.get('/:id', authenticate, getRecognitionById);

module.exports = router;