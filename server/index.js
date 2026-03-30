import 'dotenv/config'; // Load env vars before other imports
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import Tag from './models/Tag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io connection
io.on('connection', (socket) => {
  if (process.env.SOCKET_LOGS === 'true') console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    if (process.env.SOCKET_LOGS === 'true') console.log('User disconnected:', socket.id);
  });
});

// Pass io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Database Connection State
let dbConnectionError = null;

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/soulstich';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    dbConnectionError = null;
    
    // Initialize default tags if empty
    Tag.countDocuments()
      .then(count => {
        if (count === 0) {
          Tag.insertMany([
            { name: 'Puff Print' }, 
            { name: 'DTF' }, 
            { name: 'Screen Print' }, 
            { name: 'Hybrid' },
            { name: 'Oversized' },
            { name: 'Men' },
            { name: 'Women' }
          ])
          .then(() => console.log('Default tags inserted'))
          .catch(err => console.error('Error inserting default tags:', err));
        }
      })
      .catch(err => console.error('Error checking tags count:', err));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    dbConnectionError = err.message;
  });

  // Health Check / Status Middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // 1 = connected
    if (req.path.startsWith('/api')) {
       return res.status(503).json({ 
         error: 'Service Unavailable', 
         message: 'Database connection failed. Please check server logs.',
         details: dbConnectionError || 'Connecting...'
       });
    }
  }
  next();
});

// Routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const distPath = path.join(__dirname, '..', 'dist');
console.log(distPath);

app.use(express.static(distPath));

// Serve index.html for all other routes (Express 5 compatibility)
app.get('/*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
