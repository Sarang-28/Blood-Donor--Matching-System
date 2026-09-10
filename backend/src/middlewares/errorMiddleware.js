const { apiError } = require('../utils/apiResponse');

const notFoundHandler = (req, res, next) => {
    return apiError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Application Error:', err);

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

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return apiError(res, message, statusCode);
};

module.exports = {
    notFoundHandler,
    errorHandler,
};
