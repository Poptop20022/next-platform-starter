import { Router } from 'express';
import { QuoteModel, CreateQuoteInput, UpdateQuoteInput } from '../models/Quote.js';
import { LotModel } from '../models/Lot.js';
import { authenticate } from '../middleware/auth.js';
import { checkTenderAccess, requireTenderRole } from '../middleware/rbac.js';
import { auditMiddleware } from '../middleware/audit.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const quoteRoutes = Router();

const createQuoteSchema = z.object({
  tender_id: z.string().uuid(),
  lot_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  status: z.enum(['Draft', 'Submitted', 'Evaluated', 'Rejected', 'Accepted']).optional(),
  valid_until: z.string().optional().transform(s => s ? new Date(s) : undefined),
  delivery_time_days: z.number().int().optional(),
  payment_terms: z.string().optional(),
  warranty_period_months: z.number().int().optional(),
  notes: z.string().optional(),
  positions: z.array(z.object({
    position_id: z.string().uuid(),
    unit_price: z.number(),
    quantity: z.number(),
    delivery_time_days: z.number().int().optional(),
    notes: z.string().optional()
  })).optional()
});

const updateQuoteSchema = z.object({
  status: z.enum(['Draft', 'Submitted', 'Evaluated', 'Rejected', 'Accepted']).optional(),
  valid_until: z.string().optional().transform(s => s ? new Date(s) : undefined),
  total_amount: z.number().optional(),
  delivery_time_days: z.number().int().optional(),
  payment_terms: z.string().optional(),
  warranty_period_months: z.number().int().optional(),
  notes: z.string().optional()
});

// Get quotes by tender
quoteRoutes.get('/tender/:tenderId', authenticate, checkTenderAccess, async (req: any, res, next) => {
  try {
    const quotes = await QuoteModel.findByTenderId(req.params.tenderId);
    res.json(quotes);
  } catch (error) {
    next(error);
  }
});

// Get quotes by lot
quoteRoutes.get('/lot/:lotId', authenticate, async (req: any, res, next) => {
  try {
    const lot = await LotModel.findById(req.params.lotId);
    if (!lot) {
      return next(new AppError(404, 'Lot not found'));
    }
    
    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const quotes = await QuoteModel.findByLotId(req.params.lotId);
    res.json(quotes);
  } catch (error) {
    next(error);
  }
});

// Get quote by ID
quoteRoutes.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    const quote = await QuoteModel.findById(req.params.id);
    if (!quote) {
      return next(new AppError(404, 'Quote not found'));
    }
    
    req.params.tenderId = quote.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const positions = await QuoteModel.getQuotePositions(quote.id);
    res.json({ ...quote, positions });
  } catch (error) {
    next(error);
  }
});

// Create quote
quoteRoutes.post('/', authenticate, auditMiddleware('quote'), async (req: any, res, next) => {
  try {
    const data = createQuoteSchema.parse(req.body);
    
    req.params.tenderId = data.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const quote = await QuoteModel.create(data, req.user.id);
    res.status(201).json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Update quote
quoteRoutes.put('/:id', authenticate, requireTenderRole('manager'), auditMiddleware('quote'), async (req: any, res, next) => {
  try {
    const quote = await QuoteModel.findById(req.params.id);
    if (!quote) {
      return next(new AppError(404, 'Quote not found'));
    }
    
    req.params.tenderId = quote.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const data = updateQuoteSchema.parse(req.body);
    const updated = await QuoteModel.update(req.params.id, data);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Submit quote
quoteRoutes.post('/:id/submit', authenticate, requireTenderRole('manager'), async (req: any, res, next) => {
  try {
    const quote = await QuoteModel.findById(req.params.id);
    if (!quote) {
      return next(new AppError(404, 'Quote not found'));
    }
    
    req.params.tenderId = quote.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    const submitted = await QuoteModel.submit(req.params.id);
    res.json(submitted);
  } catch (error) {
    next(error);
  }
});

// Delete quote
quoteRoutes.delete('/:id', authenticate, requireTenderRole('manager'), auditMiddleware('quote'), async (req: any, res, next) => {
  try {
    const quote = await QuoteModel.findById(req.params.id);
    if (!quote) {
      return next(new AppError(404, 'Quote not found'));
    }
    
    req.params.tenderId = quote.tender_id;
    await checkTenderAccess(req, res, () => {});
    
    await QuoteModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

