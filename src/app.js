import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import authRoutes from './modules/auth/auth.routes.js';
import propertiesRoutes from './modules/properties/properties.routes.js';
import inquiriesRoutes from './modules/inquiries/inquiries.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
 
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
 
dotenv.config();

const uploadsDir = path.join(process.cwd(), 'uploads', 'properties');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api', inquiriesRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;