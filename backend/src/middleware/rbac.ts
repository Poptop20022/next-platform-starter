import { Response, NextFunction } from 'express';
import { pool } from '../db/connection.js';
import { AppError } from './errorHandler.js';
import { AuthRequest } from './auth.js';

export type TenderRole = 'admin' | 'manager' | 'evaluator' | 'viewer';

export async function checkTenderAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  requiredRole?: TenderRole
) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    const tenderId = req.params.tenderId || req.body.tenderId || req.query.tenderId;
    
    if (!tenderId) {
      return next(new AppError(400, 'Tender ID required'));
    }

    // Check if user has global admin role
    if (req.user.role === 'admin') {
      return next();
    }

    // Check tender-specific role
    const result = await pool.query(
      `SELECT role FROM tender_roles 
       WHERE tender_id = $1 AND user_id = $2`,
      [tenderId, req.user.id]
    );

    if (result.rows.length === 0) {
      return next(new AppError(403, 'Access denied to this tender'));
    }

    const userTenderRole = result.rows[0].role as TenderRole;

    // Role hierarchy: admin > manager > evaluator > viewer
    const roleHierarchy: Record<TenderRole, number> = {
      admin: 4,
      manager: 3,
      evaluator: 2,
      viewer: 1
    };

    if (requiredRole) {
      const requiredLevel = roleHierarchy[requiredRole];
      const userLevel = roleHierarchy[userTenderRole];

      if (userLevel < requiredLevel) {
        return next(new AppError(403, `Requires ${requiredRole} role or higher`));
      }
    }

    // Attach tender role to request
    (req as any).tenderRole = userTenderRole;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireTenderRole(role: TenderRole) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    checkTenderAccess(req, res, next, role);
  };
}

