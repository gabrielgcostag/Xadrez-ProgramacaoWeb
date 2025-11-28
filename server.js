const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const http = require('http');
const connectDB = require('./config/database');
const authRoutes = require('./controllers/auth');
const gamesRoutes = require('./controllers/games');
const profileRoutes = require('./controllers/profile');
const roomsRoutes = require('./controllers/rooms');
const rankingRoutes = require('./controllers/ranking');
const initializeSocket = require('./socket/socketServer');
const setupGameHandlers = require('./socket/gameHandlers');
dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);
connectDB();
app.use(cors({
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'xadrez-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        
        
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, 
        sameSite: 'lax'
    },
    
    proxy: true,
    name: 'xadrez.sid'
});

app.use(sessionMiddleware);
app.use(express.static('public'));
app.use(express.static('views'));
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/ranking', rankingRoutes);
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString()
    });
});
const io = initializeSocket(server, sessionMiddleware);
setupGameHandlers(io);
server.listen(PORT, '0.0.0.0', () => {
});
