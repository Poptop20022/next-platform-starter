import { Express } from 'express';
import { authRoutes } from './auth.js';
import { tenderRoutes } from './tenders.js';
import { lotRoutes } from './lots.js';
import { positionRoutes } from './positions.js';
import { supplierRoutes } from './suppliers.js';
import { quoteRoutes } from './quotes.js';
import { attachmentRoutes } from './attachments.js';
import { comparisonRoutes } from './comparison.js';
import { documentRoutes } from './documents.js';

export function setupRoutes(app: Express) {
  app.use('/api/auth', authRoutes);
  app.use('/api/tenders', tenderRoutes);
  app.use('/api/lots', lotRoutes);
  app.use('/api/positions', positionRoutes);
  app.use('/api/suppliers', supplierRoutes);
  app.use('/api/quotes', quoteRoutes);
  app.use('/api/attachments', attachmentRoutes);
  app.use('/api/comparison', comparisonRoutes);
  app.use('/api/documents', documentRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}

