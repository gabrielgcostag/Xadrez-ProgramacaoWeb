const Room = require('../models/Room');
const User = require('../models/User');

class RoomManager {
    constructor() {
        this.activeRooms = new Map(); 
    }

    
    async getRoom(roomId) {
        
        if (this.activeRooms.has(roomId)) {
            return this.activeRooms.get(roomId);
        }

        
        const room = await Room.findOne({ roomId });
        if (room && room.status === 'playing') {
            this.activeRooms.set(roomId, room);
        }
        return room;
    }

    
    async createRoom(userId, username, socketId) {
        let roomId;
        let exists = true;
        
        
        while (exists) {
            roomId = Room.generateRoomId();
            exists = await Room.findOne({ roomId });
        }

        const room = new Room({
            roomId,
            status: 'waiting'
        });

        room.addPlayer(userId, username, socketId);
        await room.save();

        this.activeRooms.set(roomId, room);
        return room;
    }

    
    async joinRoom(roomId, userId, username, socketId) {
        const room = await this.getRoom(roomId);

        if (!room) {
            throw new Error('Sala não encontrada');
        }

        
        if (room.player1 && room.player1.userId.toString() === userId.toString()) {
            
            room.player1.socketId = socketId;
            
            if (room.status === 'abandoned' && !room.player2) {
                room.status = 'waiting';
            } else if (room.status === 'abandoned' && room.player2) {
                room.status = 'playing';
            }
            await room.save();
            this.activeRooms.set(roomId, room);
            return room;
        }

        if (room.player2 && room.player2.userId.toString() === userId.toString()) {
            room.player2.socketId = socketId;
            
            if (room.status === 'abandoned' && !room.player1) {
                room.status = 'waiting';
            } else if (room.status === 'abandoned' && room.player1) {
                room.status = 'playing';
            }
            await room.save();
            this.activeRooms.set(roomId, room);
            return room;
        }

        
        if (room.status === 'abandoned' && !room.player1 && !room.player2) {
            room.status = 'waiting';
            room.gameState = {
                boardState: '',
                currentPlayer: 'branco',
                gameState: 'playing',
                moveHistory: [],
                capturedPieces: { branco: [], preto: [] }
            };
        }

        
        if (room.isFull()) {
            const isPlayer1 = room.player1 && room.player1.userId.toString() === userId.toString();
            const isPlayer2 = room.player2 && room.player2.userId.toString() === userId.toString();
            
            
            if (!isPlayer1 && !isPlayer2) {
                throw new Error('Sala está cheia');
            }
        }

        
        if (room.status !== 'waiting' && room.status !== 'playing' && room.status !== 'abandoned') {
            throw new Error('Sala não está disponível');
        }

        
        if (room.status === 'abandoned' && !room.player1 && !room.player2) {
            room.status = 'waiting';
        }

        
        const playerRole = room.addPlayer(userId, username, socketId);
        
        if (playerRole === 'player2') {
            
            room.status = 'playing';
            room.startedAt = new Date();
        } else if (playerRole === 'player1' && room.status === 'abandoned') {
            
            room.status = 'waiting';
        }

        await room.save();
        this.activeRooms.set(roomId, room);
        return room;
    }

    
    async leaveRoom(roomId, socketId) {
        const room = await this.getRoom(roomId);
        
        if (!room) {
            return null;
        }

        const playerRole = room.removePlayer(socketId);

        if (playerRole) {
            
            if (room.isEmpty() || (!room.player1 || !room.player2)) {
                room.status = 'abandoned';
                room.finishedAt = new Date();
            } else if (room.status === 'playing') {
                
                room.status = 'abandoned';
                room.finishedAt = new Date();
                const remainingPlayer = room.player1 || room.player2;
                if (remainingPlayer) {
                    room.winner = remainingPlayer.userId;
                }
                
                await this.updateRanking(room);
            }

            await room.save();
            this.activeRooms.delete(roomId);
        }

        return room;
    }

    
    async updateGameState(roomId, gameState) {
        const room = await this.getRoom(roomId);
        
        if (!room) {
            throw new Error('Sala não encontrada');
        }

        room.gameState = gameState;
        
        if (gameState.gameState === 'checkmate' || gameState.gameState === 'stalemate') {
            room.status = 'finished';
            room.finishedAt = new Date();
            
            if (gameState.gameState === 'checkmate') {
                
                const winnerColor = gameState.currentPlayer === 'branco' ? 'preto' : 'branco';
                const winner = winnerColor === 'branco' ? room.player1 : room.player2;
                if (winner) {
                    room.winner = winner.userId;
                }
            }
            
            
            await this.updateRanking(room);
        }

        await room.save();
        this.activeRooms.set(roomId, room);
        return room;
    }

    
    async getAvailableRooms() {
        const rooms = await Room.find({
            status: 'waiting',
            $or: [
                { player2: null },
                { player1: null }
            ]
        })
        .populate('player1.userId', 'username')
        .populate('player2.userId', 'username')
        .sort({ createdAt: -1 })
        .limit(20);

        return rooms.map(room => ({
            roomId: room.roomId,
            player1: room.player1 ? {
                username: room.player1.username
            } : null,
            player2: room.player2 ? {
                username: room.player2.username
            } : null,
            createdAt: room.createdAt
        }));
    }

    
    clearRoomCache(roomId) {
        this.activeRooms.delete(roomId);
    }

    
    async updateRanking(room) {
        try {
            if (!room || !room.player1 || !room.player2) {
                return;
            }

            const finishedAt = room.finishedAt || new Date();

            
            if (room.winner) {
                const winnerId = room.winner.toString();
                const player1Id = room.player1.userId.toString();
                const player2Id = room.player2.userId.toString();

                
                if (winnerId === player1Id) {
                    await this.updatePlayerScore(room.player1.userId, true, finishedAt);
                    await this.updatePlayerScore(room.player2.userId, false, finishedAt);
                } else if (winnerId === player2Id) {
                    await this.updatePlayerScore(room.player2.userId, true, finishedAt);
                    await this.updatePlayerScore(room.player1.userId, false, finishedAt);
                }
            }
            
            
        } catch (error) {
        }
    }

    
    async updatePlayerScore(userId, won, date) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return;
            }

            if (won) {
                user.score += 10;
                user.wins += 1;
            } else {
                
                user.score -= 10;
                user.losses += 1;
            }

            
            if (date) {
                user.lastGameDate = new Date(date);
            } else {
                user.lastGameDate = new Date();
            }

            await user.save();
        } catch (error) {
        }
    }
}

module.exports = new RoomManager();

