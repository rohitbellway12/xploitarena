const prisma = require('../utils/prisma');

// Get available permission keys based on requester's role
exports.getPermissions = async (req, res) => {
  try {
    const userRole = req.user.role;
    let category = 'RESEARCHER';
    
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') category = 'ADMIN';
    else if (userRole === 'COMPANY_ADMIN') category = 'COMPANY';

    const permissions = await prisma.permission.findMany({
      where: { category },
      orderBy: { name: 'asc' }
    });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a custom role with boundary checks
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;
    const ownerId = req.user.id;
    const userRole = req.user.role;

    // Verify that all assigned permissions match the user's category
    let allowedCategory = 'RESEARCHER';
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') allowedCategory = 'ADMIN';
    else if (userRole === 'COMPANY_ADMIN') allowedCategory = 'COMPANY';

    const validPermissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds }, category: allowedCategory }
    });

    if (validPermissions.length !== permissionIds.length) {
      return res.status(403).json({ message: 'Unauthorized permission assignment detected' });
    }

    const role = await prisma.customRole.create({
      data: {
        name,
        description,
        ownerId,
        permissions: {
          create: permissionIds.map(id => ({
            permission: { connect: { id } }
          }))
        }
      }
    });

    res.status(201).json({ message: 'Role created successfully', role });
  } catch (error) {
    console.error('Create Role Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get roles owned by the logged-in user (Admin/Company/Researcher)
exports.getMyRoles = async (req, res) => {
  try {
    const roles = await prisma.customRole.findMany({
      where: { ownerId: req.user.id },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update an existing custom role (Edit permissions)
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;
    const ownerId = req.user.id;
    const userRole = req.user.role;

    // Verify ownership
    const role = await prisma.customRole.findFirst({
      where: { id, ownerId }
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found or unauthorized' });
    }

    // Verify permissions category
    let allowedCategory = 'RESEARCHER';
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') allowedCategory = 'ADMIN';
    else if (userRole === 'COMPANY_ADMIN') allowedCategory = 'COMPANY';

    const validPermissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds }, category: allowedCategory }
    });

    if (validPermissions.length !== permissionIds.length) {
      return res.status(403).json({ message: 'Unauthorized permission assignment detected' });
    }

    // Update role using transaction (delete old, create new)
    const updatedRole = await prisma.$transaction(async (tx) => {
      // Delete existing role_permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Update basic details and recreate permissions
      return await tx.customRole.update({
        where: { id },
        data: {
          name,
          description,
          permissions: {
            create: permissionIds.map(pid => ({
              permission: { connect: { id: pid } }
            }))
          }
        },
        include: {
          permissions: { include: { permission: true } }
        }
      });
    });

    res.json({ message: 'Role updated successfully', role: updatedRole });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Assign a role to an employee/member
exports.assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const ownerId = req.user.id;

    // Verify ownership: Is this user actually a team member of the requester?
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, parentId: ownerId }
    });

    if (!targetUser) {
      return res.status(403).json({ message: 'User not found in your team' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { customRoleId: roleId }
    });

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Create a new permission (Global)
exports.createPermission = async (req, res) => {
  try {
    const { key, name, description, category } = req.body;
    
    const permission = await prisma.permission.create({
      data: { key, name, description, category }
    });

    res.status(201).json({ message: 'Permission created successfully', permission });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Permission key already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a permission
exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.permission.delete({ where: { id } });
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
