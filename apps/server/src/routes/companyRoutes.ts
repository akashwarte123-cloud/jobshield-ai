import { Router } from 'express';
import { verifyCompanyHandler } from '../controllers/companyController.js';

export const companyRouter = Router();

companyRouter.get('/verify', verifyCompanyHandler);
