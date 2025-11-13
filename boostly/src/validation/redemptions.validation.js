const Joi = require('joi');

/**
 * Validation schema for creating a redemption
 */
const createRedemptionSchema = Joi.object({
    credits_redeemed: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Credits to redeem must be a number',
            'number.positive': 'Credits to redeem must be positive',
            'any.required': 'Credits to redeem is required'
        })
});

module.exports = {
    createRedemptionSchema
};