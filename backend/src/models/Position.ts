import { pool } from '../db/connection.js';

export interface Position {
  id: string;
  lot_id: string;
  number: number;
  name: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePositionInput {
  lot_id: string;
  number: number;
  name: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  notes?: string;
}

export interface UpdatePositionInput {
  number?: number;
  name?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  notes?: string;
}

export class PositionModel {
  static async create(input: CreatePositionInput): Promise<Position> {
    const result = await pool.query(
      `INSERT INTO positions (lot_id, number, name, description, unit, quantity, unit_price, total_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.lot_id,
        input.number,
        input.name,
        input.description || null,
        input.unit || null,
        input.quantity || null,
        input.unit_price || null,
        input.total_price || null,
        input.notes || null
      ]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Position | null> {
    const result = await pool.query('SELECT * FROM positions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByLotId(lotId: string): Promise<Position[]> {
    const result = await pool.query(
      'SELECT * FROM positions WHERE lot_id = $1 ORDER BY number',
      [lotId]
    );
    return result.rows;
  }

  static async update(id: string, input: UpdatePositionInput): Promise<Position> {
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
      return this.findById(id) as Promise<Position>;
    }

    values.push(id);
    const query = `UPDATE positions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM positions WHERE id = $1', [id]);
  }

  static async bulkCreate(lotId: string, positions: Omit<CreatePositionInput, 'lot_id'>[]): Promise<Position[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const created: Position[] = [];

      for (const pos of positions) {
        const result = await client.query(
          `INSERT INTO positions (lot_id, number, name, description, unit, quantity, unit_price, total_price, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            lotId,
            pos.number,
            pos.name,
            pos.description || null,
            pos.unit || null,
            pos.quantity || null,
            pos.unit_price || null,
            pos.total_price || null,
            pos.notes || null
          ]
        );
        created.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return created;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

