require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const config = require('./config');

// Import routes
const facebookRoutes = require('./routes/facebook');
const commentsRoutes = require('./routes/comments');
const authRoutes = require('./routes/auth');

const app = express();

// SSL options
const options = {
    key: fs.readFileSync('./localhost-key.pem'),
    cert: fs.readFileSync('./localhost.pem')
};

// Create HTTPS server
const server = https.createServer(options, app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://connect.facebook.net"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://graph.facebook.com", "https://www.facebook.com", "https://*.facebook.com"],
            frameSrc: ["'self'", "https://www.facebook.com", "https://*.facebook.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/facebook', facebookRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/auth', authRoutes);

// Auth callback route
app.get('/auth/callback', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth-callback.html'));
});

// Login route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Handle real-time comment updates
    socket.on('newComment', (data) => {
        socket.broadcast.emit('commentReceived', data);
    });

    socket.on('commentReplied', (data) => {
        socket.broadcast.emit('replySent', data);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: config.server.env === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start HTTPS server
const PORT = config.server.port;
server.listen(PORT, () => {
    console.log(`🚀 HTTPS Server running on port ${PORT}`);
    console.log(`🔒 SSL Certificate: localhost.pem`);
    console.log(`📱 Facebook Comments Manager is ready!`);
    console.log(`🌐 Open https://localhost:${PORT} in your browser`);
    console.log(`🔑 Facebook Login should work now!`);
});

module.exports = { app, server, io };
