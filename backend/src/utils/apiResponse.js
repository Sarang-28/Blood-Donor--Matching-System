/**
 * Standard API Response helpers
 */
const apiSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const apiError = (res, error = 'Something went wrong', statusCode = 500, details = null) => {
    const errorMessage = typeof error === 'string' ? error : (error.message || 'An error occurred');
    const payload = {
        success: false,
        message: errorMessage,
        error: errorMessage,
    };
    if (details) {
        payload.details = details;
    }
    return res.status(statusCode).json(payload);
};

module.exports = {
    apiSuccess,
    apiError,
};
