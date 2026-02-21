const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication — parent user manages their own employees
router.get('/', protect, employeeController.getEmployees);
router.post('/', protect, employeeController.createEmployee);
router.patch('/:id', protect, employeeController.updateEmployee);
router.patch('/:id/toggle-status', protect, employeeController.toggleEmployeeStatus);
router.delete('/:id', protect, employeeController.deleteEmployee);
router.patch('/bulk/toggle-status', protect, employeeController.bulkToggleStatus);

module.exports = router;
