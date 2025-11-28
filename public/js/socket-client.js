const getSocketURL = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    let port = window.location.port;
    
    
    
    let url;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        
        if (!port || port === '') {
            port = '3000';
        }
        url = `${protocol}//${hostname}:${port}`;
    } else {
        if (port && port !== '') {
            url = `${protocol}//${hostname}:${port}`;
        } else {
            url = `${protocol}//${hostname}`;
        }
    }
    
    return url;
};

const socket = io(getSocketURL(), {
    withCredentials: true,
    transports: ['websocket', 'polling'], 
    upgrade: true,
    rememberUpgrade: true
});
const SocketEvents = {
    
    connect: () => {
    },

    disconnect: () => {
    },

    error: (error) => {
        if (typeof window.onSocketError === 'function') {
            window.onSocketError(error);
        }
    },

    
    'room-created': (data) => {
        if (typeof window.onRoomCreated === 'function') {
            window.onRoomCreated(data);
        }
    },

    
    'room-joined': (data) => {
        if (typeof window.onRoomJoined === 'function') {
            window.onRoomJoined(data);
        }
    },

    
    'opponent-joined': (data) => {
        if (typeof window.onOpponentJoined === 'function') {
            window.onOpponentJoined(data);
        }
    },

    
    'game-started': (data) => {
        if (typeof window.onGameStarted === 'function') {
            window.onGameStarted(data);
        }
    },

    
    'move-made': (data) => {
        if (typeof window.onMoveMade === 'function') {
            window.onMoveMade(data);
        }
    },

    
    'opponent-left': (data) => {
        if (typeof window.onOpponentLeft === 'function') {
            window.onOpponentLeft(data);
        }
    },

    
    'game-state-updated': (data) => {
        if (typeof window.onGameStateUpdated === 'function') {
            window.onGameStateUpdated(data);
        }
    },

    
    
    'queue-joined': (data) => {
        if (typeof window.onQueueJoined === 'function') {
            window.onQueueJoined(data);
        }
    },

    'queue-left': (data) => {
        if (typeof window.onQueueLeft === 'function') {
            window.onQueueLeft(data);
        }
    },

    'queue-updated': (data) => {
        if (typeof window.onQueueUpdated === 'function') {
            window.onQueueUpdated(data);
        }
    },

    'match-found': (data) => {
        if (typeof window.onMatchFound === 'function') {
            window.onMatchFound(data);
        }
    },

    
    
    'chat-message': (data) => {
        if (typeof window.onChatMessage === 'function') {
            window.onChatMessage(data);
        }
    },

    
    
    'videochat-invite-received': (data) => {
        if (typeof window.onVideochatInviteReceived === 'function') {
            window.onVideochatInviteReceived(data);
        }
    },

    'videochat-accepted': (data) => {
        if (typeof window.onVideochatAccepted === 'function') {
            window.onVideochatAccepted(data);
        }
    },

    'videochat-rejected': (data) => {
        if (typeof window.onVideochatRejected === 'function') {
            window.onVideochatRejected(data);
        }
    },
    
    'webrtc-offer': (data) => {
        if (typeof window.onWebRTCOffer === 'function') {
            window.onWebRTCOffer(data);
        }
    },

    'webrtc-answer': (data) => {
        if (typeof window.onWebRTCAnswer === 'function') {
            window.onWebRTCAnswer(data);
        }
    },

    'webrtc-ice-candidate': (data) => {
        if (typeof window.onWebRTCICECandidate === 'function') {
            window.onWebRTCICECandidate(data);
        }
    }
};
Object.keys(SocketEvents).forEach(event => {
    socket.on(event, SocketEvents[event]);
});
const SocketAPI = {
    
    createRoom() {
        socket.emit('create-room');
    },

    
    joinRoom(roomId) {
        socket.emit('join-room', { roomId });
    },

    
    makeMove(roomId, fromRow, fromCol, toRow, toCol) {
        socket.emit('make-move', {
            roomId,
            fromRow,
            fromCol,
            toRow,
            toCol
        });
    },

    
    leaveRoom(roomId) {
        socket.emit('leave-room', { roomId });
    },

    
    requestGameState(roomId) {
        socket.emit('request-game-state', { roomId });
    },

    
    getSocketId() {
        return socket.id;
    },

    
    
    joinQueue() {
        socket.emit('join-queue');
    },

    leaveQueue() {
        socket.emit('leave-queue');
    },

    
    
    sendChatMessage(roomId, message, target) {
        socket.emit('chat-message', { roomId, message, target });
    },

    
    
    sendVideochatInvite(roomId) {
        socket.emit('videochat-invite', { roomId });
    },

    acceptVideochatInvite(roomId) {
        socket.emit('videochat-accept', { roomId });
    },

    rejectVideochatInvite(roomId) {
        socket.emit('videochat-reject', { roomId });
    },
    
    sendWebRTCOffer(roomId, offer) {
        socket.emit('webrtc-offer', { roomId, offer });
    },

    sendWebRTCAnswer(roomId, answer) {
        socket.emit('webrtc-answer', { roomId, answer });
    },

    sendWebRTCICECandidate(roomId, candidate) {
        socket.emit('webrtc-ice-candidate', { roomId, candidate });
    }
};
window.socket = socket;
window.SocketAPI = SocketAPI;

