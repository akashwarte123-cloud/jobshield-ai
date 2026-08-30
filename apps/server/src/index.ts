/**
 * VeriJob API Backend Server Entry Point
 */

import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyzeRoutes.js';
import { companyRouter } from './routes/companyRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Setup
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health Check Route
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'VeriJob Backend API Service',
    timestamp: new Date().toISOString()
  });
});

// API v1 Router Registration
app.use('/api/v1', analyzeRouter);
app.use('/api/v1/company', companyRouter);

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 VeriJob Production API Backend running on http://localhost:${PORT}`);
});

export default app;
