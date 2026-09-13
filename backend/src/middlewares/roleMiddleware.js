const { apiError } = require('../utils/apiResponse');

/**
 * Role-Based Access Control (RBAC) middleware
 * @param  {...string} allowedRoles Roles allowed to access the endpoint
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return apiError(res, 'User not authenticated', 401);
        }

        const userRoles = req.user.roles || [req.user.role];
        const isAuthorized = allowedRoles.some(r => userRoles.includes(r));

        if (!isAuthorized) {
            return apiError(
                res,
                `Access forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]`,
                403
            );
        }

        next();
    };
};

module.exports = {
    authorizeRoles,
};
