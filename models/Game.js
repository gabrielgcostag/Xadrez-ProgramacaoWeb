const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
    fromRow: { type: Number, required: true },
    fromCol: { type: Number, required: true },
    toRow: { type: Number, required: true },
    toCol: { type: Number, required: true },
    piece: { type: String, required: true },
    capturedPiece: { type: String, default: null },
    timestamp: { type: Date, default: Date.now }
});

const gameSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameMode: {
        type: String,
        enum: ['human-vs-human', 'human-vs-ai'],
        default: 'human-vs-human'
    },
    aiDifficulty: {
        type: Number,
        default: 7
    },
    currentPlayer: {
        type: String,
        enum: ['branco', 'preto'],
        default: 'branco'
    },
    gameState: {
        type: String,
        enum: ['playing', 'check', 'checkmate', 'stalemate', 'draw'],
        default: 'playing'
    },
    moveHistory: [moveSchema],
    capturedPieces: {
        branco: [String],
        preto: [String]
    },
    boardState: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    finishedAt: {
        type: Date,
        default: null
    },
    winner: {
        type: String,
        enum: ['branco', 'preto', 'draw', null],
        default: null
    }
});
gameSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Game', gameSchema);
