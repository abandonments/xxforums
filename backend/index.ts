import 'dotenv/config';

import express, { Response, NextFunction, Request } from 'express';
import { Pool } from 'pg';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const knexfile: any = require('../knexfile.cjs');
import knex from 'knex';
import admin from 'firebase-admin';
import path from 'path'; // Still needed for serviceAccountPath
import { fileURLToPath } from 'url';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createServer } from 'http'; // Add this import
import { Server } from 'socket.io'; // Add this import

import forumRoutes from './src/routes/forumRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import moderationRoutes from './src/routes/moderationRoutes.js';
import moneroRoutes from './src/routes/moneroRoutes.js';
import broadcastRoutes from './src/routes/broadcastRoutes.js';
import shoutboxRoutes from './src/routes/shoutboxRoutes.js';
import escrowRoutes from './src/routes/escrowRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { authenticateFirebaseToken, socketAuthMiddleware } from './src/middleware/authMiddleware.js'; // Import socketAuthMiddleware
import { sanitizeInput } from './src/middleware/sanitizationMiddleware.js'; // Import sanitizeInput
import { uploadImage } from './src/controllers/uploadController.js';
import logger from './src/lib/logger.js'; // Import shared logger
import { checkIncomingPayments } from './src/lib/monero.js'; // Import Monero payment checker

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app); // Create HTTP server
const io = new Server(httpServer, { // Initialize Socket.IO
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});
io.use(socketAuthMiddleware); // Apply Socket.IO authentication middleware
const port = 3000;

const knexInstance = knex((knexfile as any).development);

let firebaseInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully from base64 environment variable.');
    firebaseInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK from base64 environment variable:', error);
    process.exit(1);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    const serviceAccountPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully from file path.');
    firebaseInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK from file path:', error);
    process.exit(1);
  }
} else {
  console.warn('Neither FIREBASE_SERVICE_ACCOUNT_BASE64 nor FIREBASE_SERVICE_ACCOUNT_PATH set. Firebase Admin SDK not initialized.');
}


const corsOptions = {
  origin: process.env.FRONTEND_URL, 
  methods: 'GET,HEAD,PUT,PATCH',
  credentials: true, 
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
});

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Using memory storage for buffer access

app.use(express.json());
app.use(sanitizeInput); // Apply sanitization middleware globally for Express routes

// Extend Express Request type to include file for Multer
import type { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      file?: Multer.File;
      userId?: string;
    }
  }
}


app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the Node.js/Express backend!');
});


app.get('/db-test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.status(200).json({ message: 'Database connected successfully!', timestamp: result.rows[0].now });
  } catch (err: unknown) {
    logger.error('Database connection error:', err);
    if (err instanceof Error) {
      next({ statusCode: 500, message: 'Database connection failed', error: err.message });
    } else {
      next({ statusCode: 500, message: 'Database connection failed', error: 'An unknown error occurred' });
    }
  }
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// Register user routes
app.use('/api/users', userRoutes);

// Register moderation routes
app.use('/api/moderation', moderationRoutes);

// Register monero routes
app.use('/api/monero', moneroRoutes);

// Register broadcast routes
app.use('/api/broadcast', broadcastRoutes);

// Register shoutbox routes
app.use('/api/shoutbox', shoutboxRoutes);

// Register escrow routes
app.use('/api/escrow', escrowRoutes);

// Register notification routes
app.use('/api/notifications', notificationRoutes);

// Removed individual initiate-profile, reputation/vote, moderation/warn routes


app.post(
  '/api/upload/image',
  authenticateFirebaseToken,
  upload.single('image'), // 'image' is the field name for the file in the multipart form
  uploadImage
);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred.';


  if (app.get('env') === 'production') {
    res.status(statusCode).json({ message: 'An internal server error occurred.' });
  } else {
    res.status(statusCode).json({ message: message, error: err.message, stack: err.stack });
  }
});

import { handleSocketConnection } from './src/controllers/socketController.js';

handleSocketConnection(io);

httpServer.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
    console.log(`Socket.IO listening on port ${port}`);
});



// Register forum routes
app.use('/api/forum', forumRoutes);

// Start a background process to check for Monero payments
const paymentCheckInterval = 5 * 60 * 1000; // 5 minutes
setInterval(async () => {
  logger.info('Checking for new Monero payments...');
  try {
    const transfers = await checkIncomingPayments();
    for (const transfer of transfers) {
      // Find the user associated with the payment
      const user = await knexInstance('users').where({ monero_integrated_address: transfer.getAddress() }).first();
      if (user) {
        // Check if this transaction has already been processed
        const existingPayment = await knexInstance('monero_payments').where({ tx_hash: transfer.getTxHash() }).first();
        if (!existingPayment) {
          // Save the payment record
          await knexInstance('monero_payments').insert({
            user_id: user.id,
            amount: transfer.getAmount(),
            tx_hash: transfer.getTxHash(),
            status: 'confirmed',
          });

          // Update the user's role (example: upgrade to 'VIP' for any payment)
          await knexInstance('users').where({ id: user.id }).update({ role: 'VIP' });
          logger.info(`Processed payment for user ${user.username} and upgraded to VIP.`);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking for Monero payments:', error);
  }
}, paymentCheckInterval);

process.on('SIGINT', () => {
  pool.end(() => {
    console.log('PostgreSQL pool has ended');
    knexInstance.destroy(() => {
      console.log('Knex connection pool has ended');
      process.exit(0);
    });
  });
});

export { app, io, knexInstance, pool };