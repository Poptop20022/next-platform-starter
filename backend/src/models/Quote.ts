import { pool } from '../db/connection.js';

export type QuoteStatus = 'Draft' | 'Submitted' | 'Evaluated' | 'Rejected' | 'Accepted';

export interface Quote {
  id: string;
  tender_id: string;
  lot_id: string;
  supplier_id: string;
  status: QuoteStatus;
  submitted_at?: Date;
  valid_until?: Date;
  total_amount?: number;
  delivery_time_days?: number;
  payment_terms?: string;
  warranty_period_months?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface QuotePosition {
  id: string;
  quote_id: string;
  position_id: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  delivery_time_days?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateQuoteInput {
  tender_id: string;
  lot_id: string;
  supplier_id: string;
  status?: QuoteStatus;
  valid_until?: Date;
  delivery_time_days?: number;
  payment_terms?: string;
  warranty_period_months?: number;
  notes?: string;
  positions?: Array<{
    position_id: string;
    unit_price: number;
    quantity: number;
    delivery_time_days?: number;
    notes?: string;
  }>;
}

export interface UpdateQuoteInput {
  status?: QuoteStatus;
  valid_until?: Date;
  total_amount?: number;
  delivery_time_days?: number;
  payment_terms?: string;
  warranty_period_months?: number;
  notes?: string;
}

export class QuoteModel {
  static async create(input: CreateQuoteInput, userId: string): Promise<Quote> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calculate total amount from positions if provided
      let totalAmount = 0;
      if (input.positions && input.positions.length > 0) {
        totalAmount = input.positions.reduce((sum, pos) => {
          return sum + (pos.unit_price * pos.quantity);
        }, 0);
      }

      const quoteResult = await client.query(
        `INSERT INTO quotes (tender_id, lot_id, supplier_id, status, valid_until, delivery_time_days, payment_terms, warranty_period_months, notes, total_amount, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          input.tender_id,
          input.lot_id,
          input.supplier_id,
          input.status || 'Draft',
          input.valid_until || null,
          input.delivery_time_days || null,
          input.payment_terms || null,
          input.warranty_period_months || null,
          input.notes || null,
          totalAmount || null,
          userId
        ]
      );

      const quote = quoteResult.rows[0];

      // Create quote positions
      if (input.positions && input.positions.length > 0) {
        for (const pos of input.positions) {
          const totalPrice = pos.unit_price * pos.quantity;
          await client.query(
            `INSERT INTO quote_positions (quote_id, position_id, unit_price, quantity, total_price, delivery_time_days, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              quote.id,
              pos.position_id,
              pos.unit_price,
              pos.quantity,
              totalPrice,
              pos.delivery_time_days || null,
              pos.notes || null
            ]
          );
        }
      }

      await client.query('COMMIT');
      return quote;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id: string): Promise<Quote | null> {
    const result = await pool.query('SELECT * FROM quotes WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByTenderId(tenderId: string): Promise<Quote[]> {
    const result = await pool.query(
      'SELECT * FROM quotes WHERE tender_id = $1 ORDER BY created_at DESC',
      [tenderId]
    );
    return result.rows;
  }

  static async findByLotId(lotId: string): Promise<Quote[]> {
    const result = await pool.query(
      'SELECT * FROM quotes WHERE lot_id = $1 ORDER BY created_at DESC',
      [lotId]
    );
    return result.rows;
  }

  static async getQuotePositions(quoteId: string): Promise<QuotePosition[]> {
    const result = await pool.query(
      'SELECT * FROM quote_positions WHERE quote_id = $1 ORDER BY created_at',
      [quoteId]
    );
    return result.rows;
  }

  static async update(id: string, input: UpdateQuoteInput): Promise<Quote> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id) as Promise<Quote>;
    }

    values.push(id);
    const query = `UPDATE quotes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async submit(id: string): Promise<Quote> {
    const result = await pool.query(
      `UPDATE quotes SET status = 'Submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM quotes WHERE id = $1', [id]);
  }
}

