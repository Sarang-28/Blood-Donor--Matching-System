const { apiError } = require('../utils/apiResponse');

const notFoundHandler = (req, res, next) => {
    return apiError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
    console.error('Application error:', {code: err.code || 'application', status: err.statusCode || err.status || 500});

    // Specific PostgreSQL error handling
    if (err.code === '23505') { // unique_violation
        return apiError(res, 'A record with this information already exists.', 409);
    }
    if (err.code === '23503') { // foreign_key_violation
        return apiError(res, 'Referenced record does not exist.', 400);
    }
    if (err.code === '22P02') { // invalid_text_representation (e.g. invalid UUID format)
        return apiError(res, 'Invalid format or parameter type provided.', 400);
    }

    if (['23514', '22003', '22007', '22008'].includes(err.code)) return apiError(res, 'Invalid input values.', 400);
    const statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';
    if (statusCode >= 500) {
        message = 'An unexpected error occurred. Please contact system support.';
    }
    return apiError(res, message, statusCode);
};

module.exports = {
    notFoundHandler,
    errorHandler,
};
