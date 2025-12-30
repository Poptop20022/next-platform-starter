import { pool } from '../db/connection.js';

export interface Lot {
  id: string;
  tender_id: string;
  number: number;
  title: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLotInput {
  tender_id: string;
  number: number;
  title: string;
  description?: string;
}

export interface UpdateLotInput {
  number?: number;
  title?: string;
  description?: string;
}

export class LotModel {
  static async create(input: CreateLotInput): Promise<Lot> {
    const result = await pool.query(
      `INSERT INTO lots (tender_id, number, title, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.tender_id, input.number, input.title, input.description || null]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Lot | null> {
    const result = await pool.query('SELECT * FROM lots WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByTenderId(tenderId: string): Promise<Lot[]> {
    const result = await pool.query(
      'SELECT * FROM lots WHERE tender_id = $1 ORDER BY number',
      [tenderId]
    );
    return result.rows;
  }

  static async update(id: string, input: UpdateLotInput): Promise<Lot> {
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
      return this.findById(id) as Promise<Lot>;
    }

    values.push(id);
    const query = `UPDATE lots SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM lots WHERE id = $1', [id]);
  }
}

