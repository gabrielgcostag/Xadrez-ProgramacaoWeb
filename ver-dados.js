require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Game = require('./models/Game');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xadrez';

async function verDados() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const users = await User.find().select('-password');
        
        if (users.length > 0) {
            users.forEach((u, index) => {
                if (u.lastLogin) {
                }
            });
        } else {
        }
        
        const games = await Game.find().populate('userId', 'username');
        
        if (games.length > 0) {
            games.forEach((g, index) => {
                if (g.finishedAt) {
                }
            });
            
            const porModo = await Game.aggregate([
                { $group: { _id: '$gameMode', total: { $sum: 1 } } }
            ]);
            porModo.forEach(m => {
                const modo = m._id === 'human-vs-human' ? 'Humano vs Humano' : 'Humano vs Bot';
            });
            
            const porEstado = await Game.aggregate([
                { $group: { _id: '$gameState', total: { $sum: 1 } } }
            ]);
            porEstado.forEach(e => {
            });
        } else {
        }
        
        await mongoose.disconnect();
    } catch (error) {
        process.exit(1);
    }
}

verDados();
