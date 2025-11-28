const { Server } = require('socket.io');

function initializeSocket(server, sessionMiddleware) {
    const io = new Server(server, {
        cors: {
            origin: true,
            credentials: true
        }
    });

    // Compartilhar sessão do Express com Socket.io
    io.engine.use(sessionMiddleware);

    return io;
}

module.exports = initializeSocket;

