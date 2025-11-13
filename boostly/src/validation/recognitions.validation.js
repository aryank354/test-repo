const Joi = require('joi');

/**
 * Validation schema for creating a recognition
 */
const createRecognitionSchema = Joi.object({
    receiver_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Receiver ID must be a number',
            'number.positive': 'Receiver ID must be positive',
            'any.required': 'Receiver ID is required'
        }),
    amount: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required()
        .messages({
            'number.base': 'Amount must be a number',
            'number.min': 'Amount must be at least 1 credit',
            'number.max': 'Amount cannot exceed 100 credits per recognition',
            'any.required': 'Amount is required'
        }),
    message: Joi.string()
        .max(500)
        .allow('', null)
        .messages({
            'string.max': 'Message cannot exceed 500 characters'
        })
});

module.exports = {
    createRecognitionSchema
};