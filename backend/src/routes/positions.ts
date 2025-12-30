import { Router } from 'express';
import { PositionModel, CreatePositionInput, UpdatePositionInput } from '../models/Position.js';
import { LotModel } from '../models/Lot.js';
import { authenticate } from '../middleware/auth.js';
import { checkTenderAccess, requireTenderRole } from '../middleware/rbac.js';
import { auditMiddleware } from '../middleware/audit.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

export const positionRoutes = Router();

const upload = multer({ dest: 'uploads/temp/' });

const createPositionSchema = z.object({
  lot_id: z.string().uuid(),
  number: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().optional(),
  unit_price: z.number().optional(),
  total_price: z.number().optional(),
  notes: z.string().optional()
});

const updatePositionSchema = z.object({
  number: z.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().optional(),
  unit_price: z.number().optional(),
  total_price: z.number().optional(),
  notes: z.string().optional()
});

// Get positions by lot
positionRoutes.get('/lot/:lotId', authenticate, async (req: any, res, next) => {
  try {
    const positions = await PositionModel.findByLotId(req.params.lotId);
    res.json(positions);
  } catch (error) {
    next(error);
  }
});

// Get position by ID
positionRoutes.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    const position = await PositionModel.findById(req.params.id);
    if (!position) {
      return next(new AppError(404, 'Position not found'));
    }
    res.json(position);
  } catch (error) {
    next(error);
  }
});

// Create position
positionRoutes.post('/', authenticate, auditMiddleware('position'), async (req: any, res, next) => {
  try {
    const data = createPositionSchema.parse(req.body);
    
    // Check lot and tender access
    const lot = await LotModel.findById(data.lot_id);
    if (!lot) {
      return next(new AppError(404, 'Lot not found'));
    }
    
    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const position = await PositionModel.create(data);
    res.status(201).json(position);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Update position
positionRoutes.put('/:id', authenticate, requireTenderRole('manager'), auditMiddleware('position'), async (req: any, res, next) => {
  try {
    const position = await PositionModel.findById(req.params.id);
    if (!position) {
      return next(new AppError(404, 'Position not found'));
    }
    
    const lot = await LotModel.findById(position.lot_id);
    if (!lot) {
      return next(new AppError(404, 'Lot not found'));
    }
    
    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const data = updatePositionSchema.parse(req.body);
    const updated = await PositionModel.update(req.params.id, data);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Delete position
positionRoutes.delete('/:id', authenticate, requireTenderRole('manager'), auditMiddleware('position'), async (req: any, res, next) => {
  try {
    const position = await PositionModel.findById(req.params.id);
    if (!position) {
      return next(new AppError(404, 'Position not found'));
    }
    
    const lot = await LotModel.findById(position.lot_id);
    if (!lot) {
      return next(new AppError(404, 'Lot not found'));
    }
    
    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    await PositionModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Import positions from Excel
positionRoutes.post('/import/:lotId', authenticate, requireTenderRole('manager'), upload.single('file'), async (req: any, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError(400, 'No file uploaded'));
    }

    const lot = await LotModel.findById(req.params.lotId);
    if (!lot) {
      return next(new AppError(404, 'Lot not found'));
    }

    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});

    // Read Excel file
    const workbook = XLSX.read(readFileSync(req.file.path), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Parse positions (expecting columns: number, name, description, unit, quantity, unit_price, notes)
    const positions = data.map((row: any, index: number) => ({
      number: row.number || row.Number || index + 1,
      name: row.name || row.Name || row['Наименование'] || '',
      description: row.description || row.Description || row['Описание'] || '',
      unit: row.unit || row.Unit || row['Ед. изм.'] || '',
      quantity: parseFloat(row.quantity || row.Quantity || row['Количество'] || 0),
      unit_price: parseFloat(row.unit_price || row['Unit Price'] || row['Цена за ед.'] || 0),
      total_price: parseFloat(row.total_price || row['Total Price'] || row['Сумма'] || 0),
      notes: row.notes || row.Notes || row['Примечания'] || ''
    }));

    const created = await PositionModel.bulkCreate(req.params.lotId, positions);
    res.status(201).json({ count: created.length, positions: created });
  } catch (error) {
    next(error);
  }
});

