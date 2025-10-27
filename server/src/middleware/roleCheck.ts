import { Request, Response, NextFunction } from 'express';

export enum UserRole {
  SUPERUSER = 'SUPERUSER',
  ADMIN = 'ADMIN',
  UMUM = 'UMUM'
}

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login first'
        });
        return;
      }

      const userRole = req.user.role as UserRole;

      // SUPERUSER can access everything
      if (userRole === UserRole.SUPERUSER) {
        next();
        return;
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden - You do not have permission to access this resource',
          requiredRole: allowedRoles,
          yourRole: userRole
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to check if user is SUPERUSER
 */
export const requireSuperuser = requireRole([UserRole.SUPERUSER]);

/**
 * Middleware to check if user is ADMIN or SUPERUSER
 */
export const requireAdmin = requireRole([UserRole.ADMIN, UserRole.SUPERUSER]);

/**
 * Middleware to allow all authenticated users
 */
export const requireAuth = requireRole([UserRole.UMUM, UserRole.ADMIN, UserRole.SUPERUSER]);
