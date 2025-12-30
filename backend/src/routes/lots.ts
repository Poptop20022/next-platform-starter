import { Router } from 'express';
import { LotModel, CreateLotInput, UpdateLotInput } from '../models/Lot.js';
import { authenticate } from '../middleware/auth.js';
import { checkTenderAccess, requireTenderRole } from '../middleware/rbac.js';
import { auditMiddleware } from '../middleware/audit.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const lotRoutes = Router();

const createLotSchema = z.object({
  tender_id: z.string().uuid(),
  number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional()
});

const updateLotSchema = z.object({
  number: z.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional()
});

// Get lots by tender
lotRoutes.get('/tender/:tenderId', authenticate, checkTenderAccess, async (req: any, res, next) => {
  try {
    const lots = await LotModel.findByTenderId(req.params.tenderId);
    res.json(lots);
  } catch (error) {
    next(error);
  }
});

// Get lot by ID
lotRoutes.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    const lot = await LotModel.findById(req.params.id);
    if (!lot) {
      return next(new AppError(404, 'Lot not found'));
    }
    res.json(lot);
  } catch (error) {
    next(error);
  }
});

// Create lot
lotRoutes.post('/', authenticate, auditMiddleware('lot'), async (req: any, res, next) => {
  try {
    const data = createLotSchema.parse(req.body);
    // Check tender access
    req.params.tenderId = data.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const lot = await LotModel.create(data);
    res.status(201).json(lot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Update lot
lotRoutes.put('/:id', authenticate, requireTenderRole('manager'), auditMiddleware('lot'), async (req: any, res, next) => {
  try {
    const lot = await LotModel.findById(req.params.id);
    if (!lot) {
      return next(new AppError(404, 'Lot not found'));
    }
    
    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const data = updateLotSchema.parse(req.body);
    const updated = await LotModel.update(req.params.id, data);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Delete lot
lotRoutes.delete('/:id', authenticate, requireTenderRole('manager'), auditMiddleware('lot'), async (req: any, res, next) => {
  try {
    const lot = await LotModel.findById(req.params.id);
    if (!lot) {
      return next(new AppError(404, 'Lot not found'));
    }
    
    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    await LotModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

