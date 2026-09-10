const express = require('express');
const patientController = require('../controllers/patientController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get(
    '/profile',
    authenticateToken,
    authorizeRoles(ROLES.PATIENT),
    patientController.getProfile
);

router.put(
    '/profile',
    authenticateToken,
    authorizeRoles(ROLES.PATIENT),
    patientController.updateProfile
);

module.exports = router;
