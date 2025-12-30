import { pool } from '../db/connection.js';

export interface Supplier {
  id: string;
  name: string;
  inn?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface CreateSupplierInput {
  name: string;
  inn?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierInput {
  name?: string;
  inn?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export class SupplierModel {
  static async create(input: CreateSupplierInput, userId: string): Promise<Supplier> {
    const result = await pool.query(
      `INSERT INTO suppliers (name, inn, contact_person, email, phone, address, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.name,
        input.inn || null,
        input.contact_person || null,
        input.email || null,
        input.phone || null,
        input.address || null,
        input.notes || null,
        userId
      ]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Supplier | null> {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(): Promise<Supplier[]> {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    return result.rows;
  }

  static async update(id: string, input: UpdateSupplierInput): Promise<Supplier> {
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
      return this.findById(id) as Promise<Supplier>;
    }

    values.push(id);
    const query = `UPDATE suppliers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
  }
}

