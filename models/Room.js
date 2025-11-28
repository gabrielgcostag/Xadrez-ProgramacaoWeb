const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    socketId: {
        type: String,
        default: null
    },
    color: {
        type: String,
        enum: ['branco', 'preto'],
        required: true
    },
    isReady: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    player1: {
        type: playerSchema,
        default: null
    },
    player2: {
        type: playerSchema,
        default: null
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished', 'abandoned'],
        default: 'waiting'
    },
    gameState: {
        boardState: {
            type: String,
            default: ''
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
        moveHistory: [{
            fromRow: Number,
            fromCol: Number,
            toRow: Number,
            toCol: Number,
            piece: String,
            capturedPiece: String,
            timestamp: Date
        }],
        capturedPieces: {
            branco: [String],
            preto: [String]
        }
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startedAt: {
        type: Date,
        default: null
    },
    finishedAt: {
        type: Date,
        default: null
    }
});
roomSchema.statics.generateRoomId = function() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};
roomSchema.methods.isFull = function() {
    return this.player1 && this.player2;
};
roomSchema.methods.isEmpty = function() {
    return !this.player1 && !this.player2;
};
roomSchema.methods.addPlayer = function(userId, username, socketId) {
    if (!this.player1) {
        this.player1 = {
            userId,
            username,
            socketId,
            color: 'branco',
            isReady: false
        };
        return 'player1';
    } else if (!this.player2) {
        this.player2 = {
            userId,
            username,
            socketId,
            color: 'preto',
            isReady: false
        };
        return 'player2';
    }
    return null;
};
roomSchema.methods.removePlayer = function(socketId) {
    if (this.player1 && this.player1.socketId === socketId) {
        this.player1 = null;
        return 'player1';
    } else if (this.player2 && this.player2.socketId === socketId) {
        this.player2 = null;
        return 'player2';
    }
    return null;
};
roomSchema.methods.getOpponent = function(socketId) {
    if (this.player1 && this.player1.socketId === socketId) {
        return this.player2;
    } else if (this.player2 && this.player2.socketId === socketId) {
        return this.player1;
    }
    return null;
};
roomSchema.methods.getPlayer = function(socketId) {
    if (this.player1 && this.player1.socketId === socketId) {
        return this.player1;
    } else if (this.player2 && this.player2.socketId === socketId) {
        return this.player2;
    }
    return null;
};

module.exports = mongoose.model('Room', roomSchema);

