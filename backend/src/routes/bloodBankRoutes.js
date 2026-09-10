const express = require('express');
const router = express.Router();
const bloodBankController = require('../controllers/bloodBankController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

// Public listing of verified blood banks
router.get('/', bloodBankController.getBloodBanksList);

// Public/authenticated view of a blood bank's inventory
router.get('/:id/inventory', bloodBankController.getInventory);

// Blood Bank authenticated routes
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.BLOOD_BANK, ROLES.ADMIN));

router.get('/profile/me', bloodBankController.getProfile);
router.put('/profile/me', bloodBankController.updateProfile);
router.get('/inventory/me', bloodBankController.getInventory);
router.put('/inventory/me', bloodBankController.updateInventory);

module.exports = router;
