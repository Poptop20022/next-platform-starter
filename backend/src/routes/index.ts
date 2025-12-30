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

import { logger } from '../utils/logger.js';

export function setupRoutes(app: Express) {
  try {
    logger.info('Setting up routes...');
    
    app.use('/api/auth', authRoutes);
    logger.info('✓ Auth routes registered at /api/auth');
    
    app.use('/api/tenders', tenderRoutes);
    logger.info('✓ Tender routes registered at /api/tenders');
    
    app.use('/api/lots', lotRoutes);
    logger.info('✓ Lot routes registered at /api/lots');
    
    app.use('/api/positions', positionRoutes);
    logger.info('✓ Position routes registered at /api/positions');
    
    app.use('/api/suppliers', supplierRoutes);
    logger.info('✓ Supplier routes registered at /api/suppliers');
    
    app.use('/api/quotes', quoteRoutes);
    logger.info('✓ Quote routes registered at /api/quotes');
    
    app.use('/api/attachments', attachmentRoutes);
    logger.info('✓ Attachment routes registered at /api/attachments');
    
    app.use('/api/comparison', comparisonRoutes);
    logger.info('✓ Comparison routes registered at /api/comparison');
    
    app.use('/api/documents', documentRoutes);
    logger.info('✓ Document routes registered at /api/documents');

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    logger.info('✓ Health check route registered at /api/health');
    
    logger.info('All routes registered successfully');
  } catch (error) {
    logger.error('Error setting up routes:', error);
    throw error;
  }
}

