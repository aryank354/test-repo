const Joi = require('joi');

/**
 * Validation schema for creating a student
 */
const createStudentSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Must be a valid email address'
        })
});

/**
 * Validate request body against schema
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        req.validatedBody = value;
        next();
    };
};

module.exports = {
    createStudentSchema,
    validate
};