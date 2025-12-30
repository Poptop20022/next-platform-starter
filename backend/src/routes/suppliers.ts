import { Router } from 'express';
import { SupplierModel, CreateSupplierInput, UpdateSupplierInput } from '../models/Supplier.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const supplierRoutes = Router();

const createSupplierSchema = z.object({
  name: z.string().min(1),
  inn: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  inn: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

// Get all suppliers
supplierRoutes.get('/', authenticate, async (req: any, res, next) => {
  try {
    const suppliers = await SupplierModel.findAll();
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

// Get supplier by ID
supplierRoutes.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    const supplier = await SupplierModel.findById(req.params.id);
    if (!supplier) {
      return next(new AppError(404, 'Supplier not found'));
    }
    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

// Create supplier
supplierRoutes.post('/', authenticate, requireRole('admin', 'manager'), auditMiddleware('supplier'), async (req: any, res, next) => {
  try {
    const data = createSupplierSchema.parse(req.body);
    const supplier = await SupplierModel.create(data, req.user.id);
    res.status(201).json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Update supplier
supplierRoutes.put('/:id', authenticate, requireRole('admin', 'manager'), auditMiddleware('supplier'), async (req: any, res, next) => {
  try {
    const data = updateSupplierSchema.parse(req.body);
    const supplier = await SupplierModel.update(req.params.id, data);
    if (!supplier) {
      return next(new AppError(404, 'Supplier not found'));
    }
    res.json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Delete supplier
supplierRoutes.delete('/:id', authenticate, requireRole('admin'), auditMiddleware('supplier'), async (req: any, res, next) => {
  try {
    await SupplierModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

