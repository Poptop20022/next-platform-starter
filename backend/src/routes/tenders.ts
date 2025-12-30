import { Router } from 'express';
import { TenderModel, CreateTenderInput, UpdateTenderInput } from '../models/Tender.js';
import { authenticate } from '../middleware/auth.js';
import { checkTenderAccess, requireTenderRole } from '../middleware/rbac.js';
import { auditMiddleware } from '../middleware/audit.js';
import { AppError } from '../middleware/errorHandler.js';
import { pool } from '../db/connection.js';
import { z } from 'zod';

export const tenderRoutes = Router();

const createTenderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  number: z.string().min(1),
  status: z.enum(['Draft', 'CollectingQuotes', 'Evaluation', 'Decision', 'Closed']).optional(),
  start_date: z.string().optional().transform(s => s ? new Date(s) : undefined),
  end_date: z.string().optional().transform(s => s ? new Date(s) : undefined),
  submission_deadline: z.string().optional().transform(s => s ? new Date(s) : undefined),
  manager_id: z.string().uuid().optional()
});

const updateTenderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['Draft', 'CollectingQuotes', 'Evaluation', 'Decision', 'Closed']).optional(),
  start_date: z.string().optional().transform(s => s ? new Date(s) : undefined),
  end_date: z.string().optional().transform(s => s ? new Date(s) : undefined),
  submission_deadline: z.string().optional().transform(s => s ? new Date(s) : undefined),
  decision_date: z.string().optional().transform(s => s ? new Date(s) : undefined),
  manager_id: z.string().uuid().optional()
});

// Get all tenders
tenderRoutes.get('/', authenticate, async (req: any, res, next) => {
  try {
    const filters: any = {};
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    // Non-admin users only see tenders they have access to
    if (req.user.role !== 'admin') {
      const result = await pool.query(
        `SELECT DISTINCT t.* FROM tenders t
         LEFT JOIN tender_roles tr ON t.id = tr.tender_id
         WHERE t.created_by = $1 OR tr.user_id = $1
         ORDER BY t.created_at DESC`,
        [req.user.id]
      );
      return res.json(result.rows);
    }

    const tenders = await TenderModel.findAll(filters);
    res.json(tenders);
  } catch (error) {
    next(error);
  }
});

// Get tender by ID
tenderRoutes.get('/:tenderId', authenticate, checkTenderAccess, async (req: any, res, next) => {
  try {
    const tender = await TenderModel.findById(req.params.tenderId);
    if (!tender) {
      return next(new AppError(404, 'Tender not found'));
    }
    res.json(tender);
  } catch (error) {
    next(error);
  }
});

// Create tender
tenderRoutes.post('/', authenticate, auditMiddleware('tender'), async (req: any, res, next) => {
  try {
    const data = createTenderSchema.parse(req.body);
    const tender = await TenderModel.create(data, req.user.id);
    res.status(201).json(tender);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Update tender
tenderRoutes.put('/:tenderId', authenticate, requireTenderRole('manager'), auditMiddleware('tender'), async (req: any, res, next) => {
  try {
    const data = updateTenderSchema.parse(req.body);
    const tender = await TenderModel.update(req.params.tenderId, data);
    if (!tender) {
      return next(new AppError(404, 'Tender not found'));
    }
    res.json(tender);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Delete tender
tenderRoutes.delete('/:tenderId', authenticate, requireTenderRole('admin'), auditMiddleware('tender'), async (req: any, res, next) => {
  try {
    await TenderModel.delete(req.params.tenderId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Assign role to user for tender
tenderRoutes.post('/:tenderId/roles', authenticate, requireTenderRole('admin'), async (req: any, res, next) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role || !['admin', 'manager', 'evaluator', 'viewer'].includes(role)) {
      return next(new AppError(400, 'Invalid userId or role'));
    }

    await TenderModel.assignRole(req.params.tenderId, userId, role);
    res.status(201).json({ message: 'Role assigned successfully' });
  } catch (error) {
    next(error);
  }
});


