const { Server } = require('socket.io');

function initializeSocket(server, sessionMiddleware) {
    const io = new Server(server, {
        cors: {
            origin: true,
            credentials: true
        }
    });

    
    io.engine.use(sessionMiddleware);

    return io;
}

module.exports = initializeSocket;

