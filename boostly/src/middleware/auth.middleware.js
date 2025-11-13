/**
 * Authentication middleware - simulates auth by checking X-User-Id header
 */
const authenticate = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required. Please provide X-User-Id header.'
        });
    }

    const parsedUserId = parseInt(userId);
    
    if (isNaN(parsedUserId) || parsedUserId <= 0) {
        return res.status(401).json({
            success: false,
            error: 'Invalid user ID. Must be a positive integer.'
        });
    }

    // Attach user ID to request object
    req.userId = parsedUserId;
    next();
};

module.exports = { authenticate };