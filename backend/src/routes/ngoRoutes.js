const express = require('express');
const ngoController = require('../controllers/ngoController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get(
    '/profile',
    authenticateToken,
    authorizeRoles(ROLES.NGO),
    ngoController.getProfile
);

router.put(
    '/profile',
    authenticateToken,
    authorizeRoles(ROLES.NGO),
    ngoController.updateProfile
);

router.get('/', ngoController.getNgoList);

module.exports = router;
