const Joi = require('joi');

/**
 * Validation schema for creating an endorsement
 */
const createEndorsementSchema = Joi.object({
    recognition_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Recognition ID must be a number',
            'number.positive': 'Recognition ID must be positive',
            'any.required': 'Recognition ID is required'
        })
});

module.exports = {
    createEndorsementSchema
};