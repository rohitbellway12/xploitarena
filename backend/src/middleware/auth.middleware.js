const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user with role and permissions to ensure they are up to date
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        customRole: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account is inactive or does not exist' });
    }

    req.user = user;
    req.permissions = user.customRole?.permissions.map(p => p.permission.key) || [];
    
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    if (error.name === 'TokenExpiredError') {
       return res.status(401).json({ message: 'Token expired', error: 'expired' });
    }
    return res.status(401).json({ message: 'Not authorized to access this route', detail: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

const hasPermission = (permissionKey) => {
  return (req, res, next) => {
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Permission Check:', {
        userId: req.user?.id,
        role: req.user?.role,
        parentId: req.user?.parentId,
        customRoleId: req.user?.customRoleId,
        permissions: req.permissions,
        requiredPermission: permissionKey
      });
    }

    // 1. Super Admin bypasses everything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // 2. Check if user has the specific permission in their custom role
    if (req.permissions && req.permissions.length > 0 && req.permissions.includes(permissionKey)) {
      return next();
    }

    // 3. Root users (no parentId): If no custom role OR custom role doesn't have permission, 
    //    grant access based on base role prefix matching
    if (!req.user.parentId) {
      if (req.user.role === 'ADMIN' && permissionKey.startsWith('admin:')) return next();
      if (req.user.role === 'COMPANY_ADMIN' && permissionKey.startsWith('company:')) return next();
      if (req.user.role === 'RESEARCHER' && permissionKey.startsWith('researcher:')) return next();
      if (req.user.role === 'TRIAGER' && permissionKey.startsWith('triage:')) return next();
    }

    // 4. Employees (with parentId): 
    //    - If no custom role assigned → inherit base role permissions
    //    - If custom role assigned → ONLY use custom role permissions (no fallback)
    if (req.user.parentId) {
      // Employee without custom role → inherit base role
      if (!req.user.customRoleId || req.permissions.length === 0) {
        if (req.user.role === 'ADMIN' && permissionKey.startsWith('admin:')) return next();
        if (req.user.role === 'COMPANY_ADMIN' && permissionKey.startsWith('company:')) return next();
        if (req.user.role === 'RESEARCHER' && permissionKey.startsWith('researcher:')) return next();
        if (req.user.role === 'TRIAGER' && permissionKey.startsWith('triage:')) return next();
      }
      // Employee with custom role → only custom permissions (already checked above, so deny)
    }

    console.warn('Permission Denied:', {
      userId: req.user?.id,
      role: req.user?.role,
      requiredPermission: permissionKey,
      userPermissions: req.permissions
    });

    return res.status(403).json({
      message: `You do not have the required permission: ${permissionKey}`,
    });
  };
};

module.exports = { protect, authorize, hasPermission };
