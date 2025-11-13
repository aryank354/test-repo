const express = require('express');
const router = express.Router();
const { 
    createRedemption, 
    getRedemptionsByStudent,
    getAllRedemptions,
    getRedemptionById
} = require('../controllers/redemptions.controller');
const { createRedemptionSchema } = require('../validation/redemptions.validation');
const { validate } = require('../validation/students.validation');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/redemptions
 * @desc    Create a new redemption (convert credits to rupees)
 * @access  Protected
 */
router.post('/', authenticate, validate(createRedemptionSchema), createRedemption);

/**
 * @route   GET /api/redemptions
 * @desc    Get all redemptions (admin view)
 * @access  Protected
 */
router.get('/', authenticate, getAllRedemptions);

/**
 * @route   GET /api/redemptions/:id
 * @desc    Get redemption by ID
 * @access  Protected
 */
router.get('/:id', authenticate, getRedemptionById);

/**
 * @route   GET /api/redemptions/student/:student_id
 * @desc    Get all redemptions for a student
 * @access  Protected
 */
router.get('/student/:student_id', authenticate, getRedemptionsByStudent);

module.exports = router;