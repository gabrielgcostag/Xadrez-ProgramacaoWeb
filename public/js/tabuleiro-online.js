var onlineGame = null;
var onlineRoomId = null;
var onlinePlayer = null;
var onlineOpponent = null;
var isMyTurn = false;

// Obter roomId da URL
function getRoomIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('roomId');
}

// Configurar callbacks do Socket.io para jogo online
function setupOnlineGameCallbacks() {
    window.onRoomJoined = (data) => {
        onlineRoomId = data.roomId;
        onlinePlayer = data.player;
        onlineOpponent = data.opponent;
        isMyTurn = data.player.color === data.gameState.currentPlayer;
        
        // Inicializar jogo com estado do servidor
        initializeOnlineGame(data.gameState);
        updateOnlineGameInfo();
    };

    window.onGameStarted = (data) => {
        onlineRoomId = data.roomId;
        onlinePlayer = data.player1?.socketId === SocketAPI.getSocketId() ? data.player1 : data.player2;
        onlineOpponent = data.player1?.socketId === SocketAPI.getSocketId() ? data.player2 : data.player1;
        
        // Determinar qual cor o jogador está
        const myColor = onlinePlayer.color;
        isMyTurn = myColor === 'branco';
        
        // Inicializar jogo
        initializeOnlineGame(data.gameState);
        updateOnlineGameInfo();
        
        showMessage('Jogo iniciado!', 'success');
    };

    window.onMoveMade = (data) => {
        // Aplicar movimento recebido
        applyOnlineMove(data.move);
        onlineGame.gameState = data.gameState;
        isMyTurn = onlinePlayer.color === data.currentPlayer;
        
        renderBoard();
        updateGameInfo();
        updateCapturedPieces();
        updateOnlineGameInfo();
    };

    window.onOpponentLeft = (data) => {
        showMessage('Oponente desconectou. A partida será encerrada.', 'error');
        setTimeout(() => {
            window.location.href = '/lobby.html';
        }, 3000);
    };

    window.onGameStateUpdated = (data) => {
        onlineGame.gameState = data.gameState;
        onlinePlayer = data.player1?.socketId === SocketAPI.getSocketId() ? data.player1 : data.player2;
        onlineOpponent = data.player1?.socketId === SocketAPI.getSocketId() ? data.player2 : data.player1;
        isMyTurn = onlinePlayer.color === data.gameState.currentPlayer;
        
        initializeOnlineGame(data.gameState);
        updateOnlineGameInfo();
    };
}

// Inicializar jogo online
function initializeOnlineGame(gameState) {
    // Criar novo jogo
    onlineGame = new ChessGame();
    
    // Aplicar estado do servidor
    if (gameState) {
        onlineGame.currentPlayer = gameState.currentPlayer;
        onlineGame.gameState = gameState.gameState;
        onlineGame.capturedPieces = gameState.capturedPieces || { branco: [], preto: [] };
        
        // TODO: Aplicar movimentos do histórico para reconstruir o tabuleiro
        // Por enquanto, começa do zero
    }
}

// Aplicar movimento recebido do oponente
function applyOnlineMove(move) {
    if (onlineGame && move) {
        const success = onlineGame.movePiece(
            move.fromRow,
            move.fromCol,
            move.toRow,
            move.toCol
        );
        
        if (success && move.capturedPiece) {
            // Adicionar peça capturada
            const piece = onlineGame.getPiece(move.toRow, move.toCol);
            if (piece) {
                // Lógica de captura já foi feita pelo movePiece
            }
        }
    }
}

// Fazer movimento online
function makeOnlineMove(fromRow, fromCol, toRow, toCol) {
    if (!isMyTurn) {
        showMessage('Não é sua vez de jogar!', 'error');
        return false;
    }

    if (!onlineRoomId) {
        showMessage('Você não está em uma sala', 'error');
        return false;
    }

    // Envia movimento para o servidor
    SocketAPI.makeMove(onlineRoomId, fromRow, fromCol, toRow, toCol);
    return true;
}

// Atualizar informações do jogo online
function updateOnlineGameInfo() {
    const currentPlayerElement = document.getElementById('current-player');
    const gameStateElement = document.getElementById('game-state');
    const opponentInfo = document.getElementById('opponent-info');
    
    if (currentPlayerElement && onlineGame) {
        const playerText = onlineGame.currentPlayer === 'branco' ? 'Brancas' : 'Pretas';
        currentPlayerElement.textContent = `Vez das ${playerText}`;
        
        if (isMyTurn) {
            currentPlayerElement.style.color = '#27ae60';
        } else {
            currentPlayerElement.style.color = '#e74c3c';
        }
    }
    
    if (gameStateElement && onlineGame) {
        let stateText = 'Jogando';
        if (onlineGame.gameState === 'check') {
            stateText = 'Xeque!';
        } else if (onlineGame.gameState === 'checkmate') {
            stateText = 'Xeque-mate!';
        } else if (onlineGame.gameState === 'stalemate') {
            stateText = 'Empate por afogamento';
        }
        gameStateElement.textContent = stateText;
    }
    
    if (opponentInfo && onlineOpponent) {
        opponentInfo.innerHTML = `
            <strong>Oponente:</strong> ${onlineOpponent.username}<br>
            <strong>Você:</strong> ${onlinePlayer?.username} (${onlinePlayer?.color})
        `;
    }
}

// Sair da partida online
function leaveOnlineGame() {
    if (confirm('Deseja realmente sair da partida?')) {
        if (onlineRoomId) {
            SocketAPI.leaveRoom(onlineRoomId);
        }
        window.location.href = '/lobby.html';
    }
}

// Mostrar mensagem
function showMessage(message, type) {
    const messageDiv = document.getElementById('online-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }
    } else {
        alert(message);
    }
}

