const getSocketURL = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    let port = window.location.port;
    
    // Se está em localhost e não tem porta, usa 3000 (desenvolvimento)
    // Se não tem porta e não é localhost, não adiciona porta (proxy reverso/Nginx)
    let url;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Desenvolvimento local
        if (!port || port === '') {
            port = '3000';
        }
        url = `${protocol}//${hostname}:${port}`;
    } else {
        // Produção (atrás de proxy reverso)
        // Se tem porta explícita na URL, usa ela. Se não, não adiciona porta
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
    transports: ['websocket', 'polling'], // Tentar WebSocket primeiro, depois polling
    upgrade: true,
    rememberUpgrade: true
});

// Eventos do Socket.io
const SocketEvents = {
    // Conectar
    connect: () => {
    },

    disconnect: () => {
    },

    error: (error) => {
        if (typeof window.onSocketError === 'function') {
            window.onSocketError(error);
        }
    },

    // Sala criada
    'room-created': (data) => {
        if (typeof window.onRoomCreated === 'function') {
            window.onRoomCreated(data);
        }
    },

    // Entrou na sala
    'room-joined': (data) => {
        if (typeof window.onRoomJoined === 'function') {
            window.onRoomJoined(data);
        }
    },

    // Oponente entrou
    'opponent-joined': (data) => {
        if (typeof window.onOpponentJoined === 'function') {
            window.onOpponentJoined(data);
        }
    },

    // Jogo começou
    'game-started': (data) => {
        if (typeof window.onGameStarted === 'function') {
            window.onGameStarted(data);
        }
    },

    // Movimento feito
    'move-made': (data) => {
        if (typeof window.onMoveMade === 'function') {
            window.onMoveMade(data);
        }
    },

    // Oponente saiu
    'opponent-left': (data) => {
        if (typeof window.onOpponentLeft === 'function') {
            window.onOpponentLeft(data);
        }
    },

    // Estado do jogo atualizado
    'game-state-updated': (data) => {
        if (typeof window.onGameStateUpdated === 'function') {
            window.onGameStateUpdated(data);
        }
    },

    // ========== FILA DE JOGADORES ==========
    
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

    // ========== CHAT ==========
    
    'chat-message': (data) => {
        if (typeof window.onChatMessage === 'function') {
            window.onChatMessage(data);
        }
    },

    // ========== VÍDEOCHAT ==========
    
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

// Registrar todos os eventos
Object.keys(SocketEvents).forEach(event => {
    socket.on(event, SocketEvents[event]);
});

// Funções para enviar eventos
const SocketAPI = {
    // Criar sala
    createRoom() {
        socket.emit('create-room');
    },

    // Entrar em sala
    joinRoom(roomId) {
        socket.emit('join-room', { roomId });
    },

    // Fazer movimento
    makeMove(roomId, fromRow, fromCol, toRow, toCol) {
        socket.emit('make-move', {
            roomId,
            fromRow,
            fromCol,
            toRow,
            toCol
        });
    },

    // Sair da sala
    leaveRoom(roomId) {
        socket.emit('leave-room', { roomId });
    },

    // Solicitar estado do jogo
    requestGameState(roomId) {
        socket.emit('request-game-state', { roomId });
    },

    // Obter socket ID
    getSocketId() {
        return socket.id;
    },

    // ========== FILA DE JOGADORES ==========
    
    joinQueue() {
        socket.emit('join-queue');
    },

    leaveQueue() {
        socket.emit('leave-queue');
    },

    // ========== CHAT ==========
    
    sendChatMessage(roomId, message, target) {
        socket.emit('chat-message', { roomId, message, target });
    },

    // ========== VÍDEOCHAT (WebRTC) ==========
    
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

// Disponibilizar globalmente
window.socket = socket;
window.SocketAPI = SocketAPI;

