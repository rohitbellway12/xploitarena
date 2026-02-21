const express = require('express');
const rbacController = require('../controllers/rbac.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Only root identities (ADMIN, COMPANY_ADMIN, or primary RESEARCHER) should manage roles
router.get('/permissions', protect, rbacController.getPermissions);
router.get('/permissions/all', protect, authorize('ADMIN', 'SUPER_ADMIN'), rbacController.getPermissions); // Admin can see all for registry
router.post('/permissions', protect, authorize('ADMIN', 'SUPER_ADMIN'), rbacController.createPermission);
router.delete('/permissions/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), rbacController.deletePermission);

router.get('/my-roles', protect, rbacController.getMyRoles);
router.post('/create-role', protect, rbacController.createRole);
router.patch('/roles/:id', protect, rbacController.updateRole);
router.post('/assign-role', protect, rbacController.assignRole);

module.exports = router;
