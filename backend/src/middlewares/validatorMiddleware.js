const { validationResult } = require('express-validator');
const { apiError } = require('../utils/apiResponse');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map((err) => ({
            field: err.path || err.param,
            message: err.msg,
        }));
        return apiError(res, 'Validation failed for one or more fields.', 400, extractedErrors);
    }
    next();
};

module.exports = {
    validate,
};
