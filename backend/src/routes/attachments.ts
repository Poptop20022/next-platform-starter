import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkTenderAccess, requireTenderRole } from '../middleware/rbac.js';
import { AppError } from '../middleware/errorHandler.js';
import { pool } from '../db/connection.js';
import { auditLog } from '../middleware/audit.js';
import multer from 'multer';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

export const attachmentRoutes = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

// Ensure upload directory exists
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
    filename: (req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      const filename = `${randomUUID()}.${ext}`;
      cb(null, filename);
    }
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
});

// Get attachments by tender
attachmentRoutes.get('/tender/:tenderId', authenticate, checkTenderAccess, async (req: any, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attachments WHERE tender_id = $1 ORDER BY uploaded_at DESC',
      [req.params.tenderId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get attachments by lot
attachmentRoutes.get('/lot/:lotId', authenticate, async (req: any, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attachments WHERE lot_id = $1 ORDER BY uploaded_at DESC',
      [req.params.lotId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get attachments by quote
attachmentRoutes.get('/quote/:quoteId', authenticate, async (req: any, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attachments WHERE quote_id = $1 ORDER BY uploaded_at DESC',
      [req.params.quoteId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Upload attachment
attachmentRoutes.post('/', authenticate, requireTenderRole('manager'), upload.single('file'), async (req: any, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError(400, 'No file uploaded'));
    }

    const { tenderId, lotId, quoteId } = req.body;

    if (!tenderId && !lotId && !quoteId) {
      return next(new AppError(400, 'tenderId, lotId, or quoteId required'));
    }

    // Check access if tenderId provided
    if (tenderId) {
      req.params.tenderId = tenderId;
      await checkTenderAccess(req, res, () => {});
    }

    const result = await pool.query(
      `INSERT INTO attachments (tender_id, lot_id, quote_id, filename, original_filename, mime_type, size, file_path, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        tenderId || null,
        lotId || null,
        quoteId || null,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.path,
        req.user.id
      ]
    );

    await auditLog('attachment', result.rows[0].id, 'CREATE', req.user.id, { filename: req.file.originalname }, req);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Download attachment
attachmentRoutes.get('/:id/download', authenticate, async (req: any, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM attachments WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return next(new AppError(404, 'Attachment not found'));
    }

    const attachment = result.rows[0];

    // Check access
    if (attachment.tender_id) {
      req.params.tenderId = attachment.tender_id;
      await checkTenderAccess(req, res, () => {});
    }

    const filePath = join(process.cwd(), attachment.file_path);
    res.download(filePath, attachment.original_filename);
  } catch (error) {
    next(error);
  }
});

// Delete attachment
attachmentRoutes.delete('/:id', authenticate, requireTenderRole('manager'), async (req: any, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM attachments WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return next(new AppError(404, 'Attachment not found'));
    }

    const attachment = result.rows[0];

    // Check access
    if (attachment.tender_id) {
      req.params.tenderId = attachment.tender_id;
      await checkTenderAccess(req, res, () => {});
    }

    await pool.query('DELETE FROM attachments WHERE id = $1', [req.params.id]);
    await auditLog('attachment', req.params.id, 'DELETE', req.user.id, {}, req);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

