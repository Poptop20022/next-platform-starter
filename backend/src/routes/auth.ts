import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditLog } from '../middleware/audit.js';
import { z } from 'zod';

export const authRoutes = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(['admin', 'manager', 'evaluator', 'viewer'])
});

// Register (only for admin in production)
authRoutes.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existingUser.rows.length > 0) {
      return next(new AppError(400, 'User already exists'));
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at`,
      [data.email, passwordHash, data.full_name, data.role]
    );

    const user = result.rows[0];
    await auditLog('user', user.id, 'CREATE', undefined, { email: user.email }, req);

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Login
authRoutes.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [data.email]
    );

    if (result.rows.length === 0) {
      return next(new AppError(401, 'Invalid credentials'));
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return next(new AppError(403, 'Account is disabled'));
    }

    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      return next(new AppError(401, 'Invalid credentials'));
    }

     const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET is required');
}

const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  secret,
  { expiresIn: '7d' } // временно жёстко задано — чтобы избежать проблем с типом
);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.errors[0].message));
    }
    next(error);
  }
});

// Get current user
authRoutes.get('/me', authenticate, async (req: any, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return next(new AppError(404, 'User not found'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

