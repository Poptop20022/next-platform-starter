import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/connection.js';
import { AuthRequest } from './auth.js';

export async function auditLog(
  entityType: string,
  entityId: string,
  action: string,
  userId: string | undefined,
  changes?: any,
  req?: Request
) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, user_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entityType,
        entityId,
        action,
        userId || null,
        changes ? JSON.stringify(changes) : null,
        req?.ip || null,
        req?.get('user-agent') || null
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

export function auditMiddleware(entityType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const entityId = req.params.id || req.body.id || req.params.tenderId;

    res.send = function (body: any) {
      if (res.statusCode < 400 && entityId) {
        const action = getActionFromMethod(req.method);
        auditLog(
          entityType,
          entityId,
          action,
          req.user?.id,
          req.body,
          req
        ).catch(console.error);
      }
      return originalSend.call(this, body);
    };

    next();
  };
}

function getActionFromMethod(method: string): string {
  const methodMap: Record<string, string> = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
    GET: 'VIEW'
  };
  return methodMap[method] || 'UNKNOWN';
}

