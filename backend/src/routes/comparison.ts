import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkTenderAccess } from '../middleware/rbac.js';
import { AppError } from '../middleware/errorHandler.js';
import { pool } from '../db/connection.js';
import * as XLSX from 'xlsx';
import { Response } from 'express';

export const comparisonRoutes = Router();

// Get comparison data for a lot
comparisonRoutes.get('/lot/:lotId', authenticate, async (req: any, res: Response, next) => {
  try {
    const { lotId } = req.params;

    // Get lot and check access
    const lotResult = await pool.query('SELECT * FROM lots WHERE id = $1', [lotId]);
    if (lotResult.rows.length === 0) {
      return next(new AppError(404, 'Lot not found'));
    }

    const lot = lotResult.rows[0];
    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});

    // Get positions
    const positionsResult = await pool.query(
      'SELECT * FROM positions WHERE lot_id = $1 ORDER BY number',
      [lotId]
    );
    const positions = positionsResult.rows;

    // Get quotes
    const quotesResult = await pool.query(
      `SELECT q.*, s.name as supplier_name, s.inn as supplier_inn
       FROM quotes q
       JOIN suppliers s ON q.supplier_id = s.id
       WHERE q.lot_id = $1 AND q.status IN ('Submitted', 'Evaluated', 'Accepted')
       ORDER BY q.total_amount`,
      [lotId]
    );
    const quotes = quotesResult.rows;

    // Get quote positions
    const quotePositionsResult = await pool.query(
      `SELECT qp.*, q.supplier_id, s.name as supplier_name
       FROM quote_positions qp
       JOIN quotes q ON qp.quote_id = q.id
       JOIN suppliers s ON q.supplier_id = s.id
       WHERE q.lot_id = $1 AND q.status IN ('Submitted', 'Evaluated', 'Accepted')`,
      [lotId]
    );
    const quotePositions = quotePositionsResult.rows;

    // Build comparison matrix
    const comparison = positions.map((position: any) => {
      const positionQuotes = quotePositions.filter((qp: any) => qp.position_id === position.id);
      
      return {
        position: {
          id: position.id,
          number: position.number,
          name: position.name,
          unit: position.unit,
          quantity: position.quantity
        },
        quotes: quotes.map((quote: any) => {
          const qp = positionQuotes.find((p: any) => p.quote_id === quote.id);
          return {
            quote_id: quote.id,
            supplier_name: quote.supplier_name,
            supplier_inn: quote.supplier_inn,
            unit_price: qp?.unit_price || null,
            quantity: qp?.quantity || null,
            total_price: qp?.total_price || null,
            delivery_time_days: qp?.delivery_time_days || quote.delivery_time_days || null,
            notes: qp?.notes || null
          };
        })
      };
    });

    res.json({
      lot: {
        id: lot.id,
        number: lot.number,
        title: lot.title
      },
      positions,
      quotes,
      comparison
    });
  } catch (error) {
    next(error);
  }
});

// Export comparison to Excel
comparisonRoutes.get('/lot/:lotId/export', authenticate, async (req: any, res: Response, next) => {
  try {
    const { lotId } = req.params;

    // Get lot and check access
    const lotResult = await pool.query('SELECT * FROM lots WHERE id = $1', [lotId]);
    if (lotResult.rows.length === 0) {
      return next(new AppError(404, 'Lot not found'));
    }

    const lot = lotResult.rows[0];
    req.params.tenderId = lot.tender_id;
    await checkTenderAccess(req, res, () => {});

    // Get positions
    const positionsResult = await pool.query(
      'SELECT * FROM positions WHERE lot_id = $1 ORDER BY number',
      [lotId]
    );
    const positions = positionsResult.rows;

    // Get quotes
    const quotesResult = await pool.query(
      `SELECT q.*, s.name as supplier_name, s.inn as supplier_inn
       FROM quotes q
       JOIN suppliers s ON q.supplier_id = s.id
       WHERE q.lot_id = $1 AND q.status IN ('Submitted', 'Evaluated', 'Accepted')
       ORDER BY q.total_amount`,
      [lotId]
    );
    const quotes = quotesResult.rows;

    // Get quote positions
    const quotePositionsResult = await pool.query(
      `SELECT qp.*, q.supplier_id, s.name as supplier_name
       FROM quote_positions qp
       JOIN quotes q ON qp.quote_id = q.id
       JOIN suppliers s ON q.supplier_id = s.id
       WHERE q.lot_id = $1 AND q.status IN ('Submitted', 'Evaluated', 'Accepted')`,
      [lotId]
    );
    const quotePositions = quotePositionsResult.rows;

    // Build Excel data
    const worksheetData: any[] = [];

    // Header row
    const header = ['№', 'Наименование', 'Ед. изм.', 'Количество'];
    quotes.forEach((quote: any) => {
      header.push(`${quote.supplier_name} (Цена)`);
      header.push(`${quote.supplier_name} (Срок)`);
      header.push(`${quote.supplier_name} (Сумма)`);
    });
    worksheetData.push(header);

    // Data rows
    positions.forEach((position: any) => {
      const row: any[] = [
        position.number,
        position.name,
        position.unit || '',
        position.quantity || ''
      ];

      quotes.forEach((quote: any) => {
        const qp = quotePositions.find((p: any) => 
          p.position_id === position.id && p.quote_id === quote.id
        );
        row.push(qp?.unit_price || '');
        row.push(qp?.delivery_time_days || quote.delivery_time_days || '');
        row.push(qp?.total_price || '');
      });

      worksheetData.push(row);
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Сравнение КП');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="comparison_lot_${lot.number}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

