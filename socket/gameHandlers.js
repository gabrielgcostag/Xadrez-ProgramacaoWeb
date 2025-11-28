const roomManager = require('./roomManager');
const queueManager = require('./queueManager');
const { requireAuth } = require('../middleware/auth');
function authenticateSocket(socket, next) {
    const session = socket.request.session;
    
    if (session && session.userId) {
        socket.userId = session.userId;
        socket.username = session.username;
        next();
    } else {
        next(new Error('Não autenticado'));
    }
}
function setupGameHandlers(io) {
    
    io.use(authenticateSocket);

    io.on('connection', (socket) => {

        
        socket.on('create-room', async () => {
            try {
                const room = await roomManager.createRoom(
                    socket.userId,
                    socket.username,
                    socket.id
                );

                socket.join(room.roomId);
                socket.emit('room-created', {
                    roomId: room.roomId,
                    player: room.player1
                });

            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        
        socket.on('join-room', async (data) => {
            try {
                const { roomId } = data;
                
                const room = await roomManager.joinRoom(
                    roomId,
                    socket.userId,
                    socket.username,
                    socket.id
                );

                socket.join(roomId);
                
                
                const isFullNow = room.player1 && room.player2;
                
                
                
                socket.emit('room-joined', {
                    roomId: room.roomId,
                    player: room.getPlayer(socket.id),
                    opponent: room.getOpponent(socket.id),
                    gameState: room.gameState,
                    status: room.status
                });

                
                if (isFullNow && room.status === 'playing') {
                    
                    if (!room.gameState || !room.gameState.boardState) {
                        if (!room.gameState) {
                            room.gameState = {
                                boardState: 'initial',
                                currentPlayer: 'branco',
                                gameState: 'playing',
                                moveHistory: [],
                                capturedPieces: { branco: [], preto: [] }
                            };
                        } else {
                            room.gameState.boardState = 'initial';
                        }
                        await room.save();
                    }
                    
                    
                    
                    io.to(roomId).emit('game-started', {
                        roomId: room.roomId,
                        player1: room.player1,
                        player2: room.player2,
                        gameState: room.gameState
                    });
                    
                } else if (room.player1 && !room.player2) {
                    
                } else if (isFullNow && room.status !== 'playing') {
                    
                    room.status = 'playing';
                    if (!room.startedAt) {
                        room.startedAt = new Date();
                    }
                    await room.save();
                    
                    
                    io.to(roomId).emit('game-started', {
                        roomId: room.roomId,
                        player1: room.player1,
                        player2: room.player2,
                        gameState: room.gameState
                    });
                }

            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        
        socket.on('make-move', async (data) => {
            try {
                const { roomId, fromRow, fromCol, toRow, toCol } = data;
                const room = await roomManager.getRoom(roomId);

                if (!room) {
                    socket.emit('error', { message: 'Sala não encontrada' });
                    return;
                }

                const player = room.getPlayer(socket.id);
                if (!player) {
                    socket.emit('error', { message: 'Você não está nesta sala' });
                    return;
                }

                
                if (room.gameState.currentPlayer !== player.color) {
                    socket.emit('error', { message: 'Não é sua vez de jogar' });
                    return;
                }

                
                if (fromRow < 1 || fromRow > 8 || fromCol < 1 || fromCol > 8 ||
                    toRow < 1 || toRow > 8 || toCol < 1 || toCol > 8) {
                    socket.emit('error', { message: 'Movimento inválido: posições fora do tabuleiro' });
                    return;
                }

                if (fromRow === toRow && fromCol === toCol) {
                    socket.emit('error', { message: 'Movimento inválido' });
                    return;
                }

                
                const move = {
                    fromRow,
                    fromCol,
                    toRow,
                    toCol,
                    piece: '', 
                    capturedPiece: null,
                    timestamp: new Date()
                };

                room.gameState.moveHistory.push(move);
                
                
                room.gameState.currentPlayer = room.gameState.currentPlayer === 'branco' ? 'preto' : 'branco';

                
                
                
                if (room.gameState.gameState === 'playing') {
                    
                }

                await roomManager.updateGameState(roomId, room.gameState);

                
                io.to(roomId).emit('move-made', {
                    move,
                    gameState: room.gameState,
                    currentPlayer: room.gameState.currentPlayer
                });

            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        
        socket.on('leave-room', async (data) => {
            try {
                const { roomId } = data;
                const room = await roomManager.leaveRoom(roomId, socket.id);

                if (room) {
                    socket.leave(roomId);
                    socket.to(roomId).emit('opponent-left', {
                        message: 'Oponente saiu da partida'
                    });
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        
        socket.on('disconnect', async () => {
            
            
            queueManager.removeFromQueue(socket.id);
            io.emit('queue-updated', {
                size: queueManager.getQueueSize(),
                players: queueManager.getQueuePlayers()
            });
            
            
            
            const rooms = await require('../models/Room').find({
                $or: [
                    { 'player1.socketId': socket.id },
                    { 'player2.socketId': socket.id }
                ],
                status: { $in: ['waiting', 'playing'] }
            });

            for (const room of rooms) {
                await roomManager.leaveRoom(room.roomId, socket.id);
                socket.to(room.roomId).emit('opponent-left', {
                    message: 'Oponente desconectou'
                });
            }
        });

        
        socket.on('request-game-state', async (data) => {
            try {
                const { roomId } = data;
                const room = await roomManager.getRoom(roomId);

                if (!room) {
                    socket.emit('error', { message: 'Sala não encontrada' });
                    return;
                }

                socket.emit('game-state-updated', {
                    gameState: room.gameState,
                    player1: room.player1,
                    player2: room.player2,
                    status: room.status
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        
        
        
        socket.on('join-queue', async () => {
            try {
                
                const rooms = await require('../models/Room').find({
                    $or: [
                        { 'player1.socketId': socket.id },
                        { 'player2.socketId': socket.id }
                    ],
                    status: { $in: ['waiting', 'playing'] }
                });

                for (const room of rooms) {
                    await roomManager.leaveRoom(room.roomId, socket.id);
                    socket.leave(room.roomId);
                }

                queueManager.addToQueue(socket.userId, socket.username, socket.id);
                socket.emit('queue-joined', {
                    position: queueManager.getQueueSize(),
                    message: 'Você entrou na fila de espera'
                });

                
                io.emit('queue-updated', {
                    size: queueManager.getQueueSize(),
                    players: queueManager.getQueuePlayers()
                });

                
                const match = queueManager.getNextMatch();
                if (match) {
                    try {
                        
                        const room = await roomManager.createRoom(
                            match.player1.userId,
                            match.player1.username,
                            match.player1.socketId
                        );
                        
                        
                        io.sockets.sockets.get(match.player1.socketId)?.join(room.roomId);
                        
                        
                        await roomManager.joinRoom(
                            room.roomId,
                            match.player2.userId,
                            match.player2.username,
                            match.player2.socketId
                        );

                        
                        io.sockets.sockets.get(match.player2.socketId)?.join(room.roomId);

                        
                        const updatedRoom = await roomManager.getRoom(room.roomId);

                        
                        io.to(match.player1.socketId).emit('room-joined', {
                            roomId: updatedRoom.roomId,
                            player: updatedRoom.getPlayer(match.player1.socketId),
                            opponent: updatedRoom.getOpponent(match.player1.socketId),
                            gameState: updatedRoom.gameState,
                            status: updatedRoom.status
                        });

                        io.to(match.player2.socketId).emit('room-joined', {
                            roomId: updatedRoom.roomId,
                            player: updatedRoom.getPlayer(match.player2.socketId),
                            opponent: updatedRoom.getOpponent(match.player2.socketId),
                            gameState: updatedRoom.gameState,
                            status: updatedRoom.status
                        });

                        
                        if (updatedRoom.status === 'playing') {
                            if (!updatedRoom.gameState || !updatedRoom.gameState.boardState) {
                                updatedRoom.gameState = {
                                    boardState: 'initial',
                                    currentPlayer: 'branco',
                                    gameState: 'playing',
                                    moveHistory: [],
                                    capturedPieces: { branco: [], preto: [] }
                                };
                                await updatedRoom.save();
                            }

                            io.to(updatedRoom.roomId).emit('game-started', {
                                roomId: updatedRoom.roomId,
                                player1: updatedRoom.player1,
                                player2: updatedRoom.player2,
                                gameState: updatedRoom.gameState
                            });
                        }

                        
                        io.emit('queue-updated', {
                            size: queueManager.getQueueSize(),
                            players: queueManager.getQueuePlayers()
                        });
                    } catch (error) {
                        
                        queueManager.addToQueue(match.player1.userId, match.player1.username, match.player1.socketId);
                        queueManager.addToQueue(match.player2.userId, match.player2.username, match.player2.socketId);
                    }
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        
        socket.on('leave-queue', () => {
            queueManager.removeFromQueue(socket.id);
            socket.emit('queue-left', { message: 'Você saiu da fila' });
            
            io.emit('queue-updated', {
                size: queueManager.getQueueSize(),
                players: queueManager.getQueuePlayers()
            });
        });

        
        
        
        socket.on('chat-message', async (data) => {
            try {
                const { roomId, message, target } = data; 
                
                if (!message || message.trim().length === 0) {
                    return;
                }

                const chatMessage = {
                    username: socket.username,
                    userId: socket.userId.toString(),
                    message: message.trim(),
                    timestamp: new Date(),
                    target: target || 'room'
                };

                if (target === 'general') {
                    
                    io.emit('chat-message', chatMessage);
                } else if (roomId) {
                    
                    const room = await roomManager.getRoom(roomId);
                    if (room && (room.getPlayer(socket.id) || room.getOpponent(socket.id))) {
                        io.to(roomId).emit('chat-message', chatMessage);
                    }
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        
        
        
        socket.on('videochat-invite', async (data) => {
            try {
                const { roomId } = data;
                const room = await roomManager.getRoom(roomId);
                
                if (!room) {
                    return;
                }

                const opponent = room.getOpponent(socket.id);
                if (opponent) {
                    io.to(opponent.socketId).emit('videochat-invite-received', {
                        from: socket.id,
                        fromUsername: socket.username,
                        roomId
                    });
                }
            } catch (error) {
            }
        });

        
        socket.on('videochat-accept', async (data) => {
            try {
                const { roomId } = data;
                const room = await roomManager.getRoom(roomId);
                
                if (!room) {
                    return;
                }

                const opponent = room.getOpponent(socket.id);
                if (opponent) {
                    io.to(opponent.socketId).emit('videochat-accepted', {
                        from: socket.id,
                        fromUsername: socket.username,
                        roomId
                    });
                }
            } catch (error) {
            }
        });

        
        socket.on('videochat-reject', async (data) => {
            try {
                const { roomId } = data;
                const room = await roomManager.getRoom(roomId);
                
                if (!room) {
                    return;
                }

                const opponent = room.getOpponent(socket.id);
                if (opponent) {
                    io.to(opponent.socketId).emit('videochat-rejected', {
                        from: socket.id,
                        fromUsername: socket.username,
                        roomId
                    });
                }
            } catch (error) {
            }
        });
        
        
        socket.on('webrtc-offer', async (data) => {
            try {
                const { roomId, offer } = data;
                const room = await roomManager.getRoom(roomId);
                
                if (!room) {
                    return;
                }

                const opponent = room.getOpponent(socket.id);
                if (opponent) {
                    io.to(opponent.socketId).emit('webrtc-offer', {
                        offer,
                        from: socket.id
                    });
                }
            } catch (error) {
            }
        });

        
        socket.on('webrtc-answer', async (data) => {
            try {
                const { roomId, answer } = data;
                const room = await roomManager.getRoom(roomId);
                
                if (!room) {
                    return;
                }

                const opponent = room.getOpponent(socket.id);
                if (opponent) {
                    io.to(opponent.socketId).emit('webrtc-answer', {
                        answer,
                        from: socket.id
                    });
                }
            } catch (error) {
            }
        });

        
        socket.on('webrtc-ice-candidate', async (data) => {
            try {
                const { roomId, candidate } = data;
                const room = await roomManager.getRoom(roomId);
                
                if (!room) {
                    return;
                }

                const opponent = room.getOpponent(socket.id);
                if (opponent) {
                    io.to(opponent.socketId).emit('webrtc-ice-candidate', {
                        candidate,
                        from: socket.id
                    });
                }
            } catch (error) {
            }
        });
    });
}

module.exports = setupGameHandlers;

