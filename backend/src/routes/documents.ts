import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkTenderAccess } from '../middleware/rbac.js';
import { AppError } from '../middleware/errorHandler.js';
import { pool } from '../db/connection.js';
import { generateInvitation, generateQuoteForm, generateProtocol } from '../services/documentGenerator.js';

export const documentRoutes = Router();

// Generate invitation document
documentRoutes.get('/tender/:tenderId/invitation', authenticate, checkTenderAccess, async (req: any, res, next) => {
  try {
    const tenderResult = await pool.query('SELECT * FROM tenders WHERE id = $1', [req.params.tenderId]);
    if (tenderResult.rows.length === 0) {
      return next(new AppError(404, 'Tender not found'));
    }

    const tender = tenderResult.rows[0];
    const format = req.query.format || 'docx'; // docx or pdf

    const buffer = await generateInvitation(tender, format);
    
    const filename = `invitation_${tender.number}.${format}`;
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Generate quote form
documentRoutes.get('/tender/:tenderId/quote-form', authenticate, checkTenderAccess, async (req: any, res, next) => {
  try {
    const tenderResult = await pool.query('SELECT * FROM tenders WHERE id = $1', [req.params.tenderId]);
    if (tenderResult.rows.length === 0) {
      return next(new AppError(404, 'Tender not found'));
    }

    const tender = tenderResult.rows[0];
    const lotsResult = await pool.query('SELECT * FROM lots WHERE tender_id = $1 ORDER BY number', [req.params.tenderId]);
    const lots = lotsResult.rows;

    const format = req.query.format || 'docx';

    const buffer = await generateQuoteForm(tender, lots, format);
    
    const filename = `quote_form_${tender.number}.${format}`;
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Generate protocol
documentRoutes.get('/tender/:tenderId/protocol', authenticate, checkTenderAccess, async (req: any, res, next) => {
  try {
    const tenderResult = await pool.query('SELECT * FROM tenders WHERE id = $1', [req.params.tenderId]);
    if (tenderResult.rows.length === 0) {
      return next(new AppError(404, 'Tender not found'));
    }

    const tender = tenderResult.rows[0];
    
    // Get lots with positions and quotes
    const lotsResult = await pool.query('SELECT * FROM lots WHERE tender_id = $1 ORDER BY number', [req.params.tenderId]);
    const lots = lotsResult.rows;

    for (const lot of lots) {
      const positionsResult = await pool.query('SELECT * FROM positions WHERE lot_id = $1 ORDER BY number', [lot.id]);
      lot.positions = positionsResult.rows;

      const quotesResult = await pool.query(
        `SELECT q.*, s.name as supplier_name
         FROM quotes q
         JOIN suppliers s ON q.supplier_id = s.id
         WHERE q.lot_id = $1 AND q.status IN ('Submitted', 'Evaluated', 'Accepted')
         ORDER BY q.total_amount`,
        [lot.id]
      );
      lot.quotes = quotesResult.rows;
    }

    const format = req.query.format || 'docx';

    const buffer = await generateProtocol(tender, lots, format);
    
    const filename = `protocol_${tender.number}.${format}`;
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

