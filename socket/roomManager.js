const Room = require('../models/Room');
const User = require('../models/User');

class RoomManager {
    constructor() {
        this.activeRooms = new Map(); // roomId -> Room document
    }

    // Carregar sala do banco ou cache
    async getRoom(roomId) {
        // Primeiro tenta do cache
        if (this.activeRooms.has(roomId)) {
            return this.activeRooms.get(roomId);
        }

        // Se não está no cache, busca do banco
        const room = await Room.findOne({ roomId });
        if (room && room.status === 'playing') {
            this.activeRooms.set(roomId, room);
        }
        return room;
    }

    // Criar nova sala
    async createRoom(userId, username, socketId) {
        let roomId;
        let exists = true;
        
        // Gera um roomId único
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

    // Entrar em sala existente
    async joinRoom(roomId, userId, username, socketId) {
        const room = await this.getRoom(roomId);

        if (!room) {
            throw new Error('Sala não encontrada');
        }

        // Verifica se jogador já está na sala (permite reconexão mesmo se sala estiver abandoned/playing)
        if (room.player1 && room.player1.userId.toString() === userId.toString()) {
            // Atualiza socketId se reconectando
            room.player1.socketId = socketId;
            // Se sala estava abandoned e agora tem jogador de volta, reativa
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
            // Se sala estava abandoned e agora tem jogador de volta, reativa
            if (room.status === 'abandoned' && !room.player1) {
                room.status = 'waiting';
            } else if (room.status === 'abandoned' && room.player1) {
                room.status = 'playing';
            }
            await room.save();
            this.activeRooms.set(roomId, room);
            return room;
        }

        // Se a sala está abandoned e não tem jogadores, reseta para waiting
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

        // Se sala está cheia E ambos os jogadores são diferentes, não permite entrar
        if (room.isFull()) {
            const isPlayer1 = room.player1 && room.player1.userId.toString() === userId.toString();
            const isPlayer2 = room.player2 && room.player2.userId.toString() === userId.toString();
            
            // Se não é nenhum dos jogadores já na sala, não pode entrar
            if (!isPlayer1 && !isPlayer2) {
                throw new Error('Sala está cheia');
            }
        }

        // Se sala não está waiting ou playing (e não é reconexão), não permite
        if (room.status !== 'waiting' && room.status !== 'playing' && room.status !== 'abandoned') {
            throw new Error('Sala não está disponível');
        }

        // Se sala está abandoned mas não tem jogadores, reseta para waiting
        if (room.status === 'abandoned' && !room.player1 && !room.player2) {
            room.status = 'waiting';
        }

        // Adiciona novo jogador
        const playerRole = room.addPlayer(userId, username, socketId);
        
        if (playerRole === 'player2') {
            // Sala ficou cheia, inicia o jogo
            room.status = 'playing';
            room.startedAt = new Date();
        } else if (playerRole === 'player1' && room.status === 'abandoned') {
            // Se estava abandoned e agora tem player1 de volta
            room.status = 'waiting';
        }

        await room.save();
        this.activeRooms.set(roomId, room);
        return room;
    }

    // Remover jogador da sala
    async leaveRoom(roomId, socketId) {
        const room = await this.getRoom(roomId);
        
        if (!room) {
            return null;
        }

        const playerRole = room.removePlayer(socketId);

        if (playerRole) {
            // Se sala ficou vazia ou só tem um jogador, marca como abandoned
            if (room.isEmpty() || (!room.player1 || !room.player2)) {
                room.status = 'abandoned';
                room.finishedAt = new Date();
            } else if (room.status === 'playing') {
                // Se estava jogando, marca como abandoned e define vencedor
                room.status = 'abandoned';
                room.finishedAt = new Date();
                const remainingPlayer = room.player1 || room.player2;
                if (remainingPlayer) {
                    room.winner = remainingPlayer.userId;
                }
                // Atualiza ranking quando jogador desiste
                await this.updateRanking(room);
            }

            try {
                // Usa findOneAndUpdate para evitar ParallelSaveError
                // Isso é atômico e evita problemas de salvamento paralelo
                const updateData = {
                    status: room.status,
                    player1: room.player1,
                    player2: room.player2
                };
                
                if (room.finishedAt) {
                    updateData.finishedAt = room.finishedAt;
                }
                if (room.winner) {
                    updateData.winner = room.winner;
                }
                
                await Room.findOneAndUpdate(
                    { _id: room._id },
                    { $set: updateData },
                    { new: true }
                );
            } catch (error) {
                // Se falhar, tenta save normal com verificação de modificação
                if (room.isModified()) {
                    try {
                        await room.save();
                    } catch (saveError) {
                        // Ignora erro de save paralelo - documento já foi atualizado
                    }
                }
            }
            this.activeRooms.delete(roomId);
        }

        return room;
    }

    // Atualizar estado do jogo
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
                // Vencedor é o jogador que não está no turno atual
                const winnerColor = gameState.currentPlayer === 'branco' ? 'preto' : 'branco';
                const winner = winnerColor === 'branco' ? room.player1 : room.player2;
                if (winner) {
                    room.winner = winner.userId;
                }
            }
            
            // Atualiza ranking após fim de partida
            await this.updateRanking(room);
        }

        await room.save();
        this.activeRooms.set(roomId, room);
        return room;
    }

    // Listar salas disponíveis
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

    // Limpar cache de sala
    clearRoomCache(roomId) {
        this.activeRooms.delete(roomId);
    }

    // Atualizar ranking dos jogadores após fim de partida
    async updateRanking(room) {
        try {
            if (!room || !room.player1 || !room.player2) {
                return;
            }

            const finishedAt = room.finishedAt || new Date();

            // Se há vencedor (checkmate)
            if (room.winner) {
                const winnerId = room.winner.toString();
                const player1Id = room.player1.userId.toString();
                const player2Id = room.player2.userId.toString();

                // Atualiza vencedor
                if (winnerId === player1Id) {
                    await this.updatePlayerScore(room.player1.userId, true, finishedAt);
                    await this.updatePlayerScore(room.player2.userId, false, finishedAt);
                } else if (winnerId === player2Id) {
                    await this.updatePlayerScore(room.player2.userId, true, finishedAt);
                    await this.updatePlayerScore(room.player1.userId, false, finishedAt);
                }
            }
            // Se é empate (stalemate) - nenhum jogador ganha ou perde pontos
            // Não faz nada
        } catch (error) {
        }
    }

    // Atualizar pontuação de um jogador individual
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
                // Perde 10 pontos
                user.score -= 10;
                user.losses += 1;
            }

            // Atualiza última data de jogo
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

