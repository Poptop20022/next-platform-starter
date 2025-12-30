import { pool } from '../db/connection.js';

export type TenderStatus = 'Draft' | 'CollectingQuotes' | 'Evaluation' | 'Decision' | 'Closed';

export interface Tender {
  id: string;
  title: string;
  description?: string;
  number: string;
  status: TenderStatus;
  start_date?: Date;
  end_date?: Date;
  submission_deadline?: Date;
  decision_date?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  manager_id?: string;
}

export interface CreateTenderInput {
  title: string;
  description?: string;
  number: string;
  status?: TenderStatus;
  start_date?: Date;
  end_date?: Date;
  submission_deadline?: Date;
  manager_id?: string;
}

export interface UpdateTenderInput {
  title?: string;
  description?: string;
  status?: TenderStatus;
  start_date?: Date;
  end_date?: Date;
  submission_deadline?: Date;
  decision_date?: Date;
  manager_id?: string;
}

export class TenderModel {
  static async create(input: CreateTenderInput, userId: string): Promise<Tender> {
    const result = await pool.query(
      `INSERT INTO tenders (title, description, number, status, start_date, end_date, submission_deadline, manager_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.title,
        input.description || null,
        input.number,
        input.status || 'Draft',
        input.start_date || null,
        input.end_date || null,
        input.submission_deadline || null,
        input.manager_id || null,
        userId
      ]
    );

    // Auto-assign creator as manager if not specified
    if (!input.manager_id) {
      await pool.query(
        `INSERT INTO tender_roles (tender_id, user_id, role)
         VALUES ($1, $2, 'manager')
         ON CONFLICT DO NOTHING`,
        [result.rows[0].id, userId]
      );
    }

    return result.rows[0];
  }

  static async findById(id: string): Promise<Tender | null> {
    const result = await pool.query('SELECT * FROM tenders WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(filters?: { status?: TenderStatus; created_by?: string }): Promise<Tender[]> {
    let query = 'SELECT * FROM tenders WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.created_by) {
      query += ` AND created_by = $${paramIndex}`;
      params.push(filters.created_by);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id: string, input: UpdateTenderInput): Promise<Tender> {
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
      return this.findById(id) as Promise<Tender>;
    }

    values.push(id);
    const query = `UPDATE tenders SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM tenders WHERE id = $1', [id]);
  }

  static async assignRole(tenderId: string, userId: string, role: string): Promise<void> {
    await pool.query(
      `INSERT INTO tender_roles (tender_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (tender_id, user_id) DO UPDATE SET role = $3`,
      [tenderId, userId, role]
    );
  }
}

