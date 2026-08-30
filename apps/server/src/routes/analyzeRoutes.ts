import { Router } from 'express';
import { analyzeJobHandler, scanJobHandler } from '../controllers/analyzeController.js';

export const analyzeRouter = Router();

analyzeRouter.post('/analyze', analyzeJobHandler);
analyzeRouter.post('/jobs/scan', scanJobHandler);
