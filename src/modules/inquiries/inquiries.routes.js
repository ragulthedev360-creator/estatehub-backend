import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/authenticate.js';
import { validate, createInquirySchema } from './inquiries.validators.js';
import { create, listMine } from './inquiries.controller.js';

const router = Router();

const inquiryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { message: 'Too many inquiries sent. Please try again later.' }, });

router.post('/properties/:id/inquiries', inquiryLimiter, validate(createInquirySchema), create);

router.get('/inquiries/mine', authenticate, listMine);

export default router;