import express from 'express';
import { downloadPDF } from '../controllers/logs.controller.js';

const router = express.Router();


router.get('/pdf', downloadPDF);

export default router;
