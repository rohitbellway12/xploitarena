const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');

// Get all employees under the current authenticated parent user
exports.getEmployees = async (req, res) => {
  try {
    const parentId = req.user.id;
    const employees = await prisma.user.findMany({
      where: { parentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        customRole: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(employees);
  } catch (error) {
    console.error('Get Employees Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new employee (sub-account) under the current user
exports.createEmployee = async (req, res) => {
  try {
    const { email, firstName, lastName, password, customRoleId } = req.body;
    const parent = req.user;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const employee = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        role: parent.role, // Inherit parent's base role
        parentId: parent.id,
        customRoleId: customRoleId || null,
        isVerified: true,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        customRole: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Create Employee Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update an employee's details
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, password, customRoleId } = req.body;
    const parentId = req.user.id;

    const employee = await prisma.user.findFirst({ where: { id, parentId } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found or access denied' });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (customRoleId !== undefined) updateData.customRoleId = customRoleId || null;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        customRole: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update Employee Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle employee active status
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user.id;

    const employee = await prisma.user.findFirst({ where: { id, parentId } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found or access denied' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !employee.isActive },
      select: { id: true, isActive: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Toggle Employee Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user.id;

    const employee = await prisma.user.findFirst({ where: { id, parentId } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found or access denied' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Employee removed successfully' });
  } catch (error) {
    console.error('Delete Employee Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk toggle status
exports.bulkToggleStatus = async (req, res) => {
  try {
    const { employeeIds, isActive } = req.body;
    const parentId = req.user.id;

    if (!employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({ message: 'employeeIds must be an array' });
    }

    await prisma.user.updateMany({
      where: { id: { in: employeeIds }, parentId },
      data: { isActive },
    });

    res.json({ message: `Updated ${employeeIds.length} employees` });
  } catch (error) {
    console.error('Bulk Toggle Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
