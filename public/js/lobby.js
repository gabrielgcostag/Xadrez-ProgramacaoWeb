
const RoomAPI = {
    async getAvailableRooms() {
        return await apiRequest('/rooms/available', {
            method: 'GET'
        });
    },

    async getRoom(roomId) {
        return await apiRequest(`/rooms/${roomId}`, {
            method: 'GET'
        });
    }
};

let currentRoom = null;
let currentPlayer = null;
let opponent = null;
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const auth = await AuthAPI.checkAuth();
        if (!auth.authenticated) {
            alert('Você precisa estar logado para jogar online!');
            window.location.href = 'login.html';
            return;
        }

        
        try {
            const profile = await ProfileAPI.getProfile();
            const headerAvatar = document.getElementById('header-avatar');
            const avatarNav = document.getElementById('user-avatar-nav');
            
            if (avatarNav && headerAvatar) {
                avatarNav.style.display = 'inline-block';
                if (profile.foto) {
                    headerAvatar.innerHTML = `<img src="${profile.foto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                } else {
                    const initial = profile.username ? profile.username.charAt(0).toUpperCase() : '?';
                    headerAvatar.textContent = initial;
                }
            }
        } catch (error) {
        }

        
        await refreshRooms();

        
        setupSocketCallbacks();
        setupQueueCallbacks();
    } catch (error) {
        window.location.href = 'login.html';
    }
});
function setupSocketCallbacks() {
    window.onRoomCreated = (data) => {
        currentRoom = { roomId: data.roomId };
        currentPlayer = data.player;
        showMessage(`Sala criada! ID: ${data.roomId}`, 'success');
        updateCurrentRoomDisplay();
        refreshRooms();
    };

    window.onRoomJoined = (data) => {
        currentRoom = { roomId: data.roomId };
        currentPlayer = data.player;
        opponent = data.opponent;
        showMessage('Você entrou na sala!', 'success');
        updateCurrentRoomDisplay();
        refreshRooms();
    };

    window.onOpponentJoined = (data) => {
        opponent = data.player;
        showMessage(`${data.player.username} entrou na sala!`, 'info');
        updateCurrentRoomDisplay();
    };

    window.onGameStarted = (data) => {
        showMessage('Jogo iniciado! Redirecionando...', 'success');
        setTimeout(() => {
            window.location.href = `tabuleiro-online.html?roomId=${data.roomId}`;
        }, 1000);
    };

    window.onOpponentLeft = (data) => {
        opponent = null;
        showMessage('Oponente saiu da sala', 'error');
        updateCurrentRoomDisplay();
    };

    window.onMoveMade = (data) => {
        
    };
}
function createRoom() {
    SocketAPI.createRoom();
}
function joinRoomById() {
    const roomId = document.getElementById('room-id-input').value.trim().toUpperCase();
    
    if (!roomId) {
        showMessage('Por favor, digite o ID da sala', 'error');
        return;
    }

    SocketAPI.joinRoom(roomId);
    document.getElementById('join-form').style.display = 'none';
}
function toggleJoinForm() {
    const form = document.getElementById('join-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}
async function refreshRooms() {
    try {
        const rooms = await RoomAPI.getAvailableRooms();
        const roomsList = document.getElementById('rooms-list');
        
        if (rooms.length === 0) {
            roomsList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhuma sala disponível no momento</p>';
            return;
        }

        roomsList.innerHTML = rooms.map(room => {
            const playerCount = (room.player1 ? 1 : 0) + (room.player2 ? 1 : 0);
            const isAvailable = playerCount < 2;
            
            return `
                <div class="room-card ${isAvailable ? 'available' : ''}" onclick="joinRoom('${room.roomId}')">
                    <div class="room-info">
                        <div class="room-id">Sala ${room.roomId}</div>
                        <div class="room-players">
                            ${room.player1 ? room.player1.username : 'Aguardando...'} 
                            ${room.player2 ? ' vs ' + room.player2.username : ''}
                        </div>
                    </div>
                    <div class="room-status status-waiting">
                        ${playerCount}/2 jogadores
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        showMessage('Erro ao carregar salas disponíveis', 'error');
    }
}
function joinRoom(roomId) {
    SocketAPI.joinRoom(roomId);
}
function updateCurrentRoomDisplay() {
    const section = document.getElementById('current-room-section');
    const waitingDiv = document.getElementById('waiting-opponent');
    const gameReadyDiv = document.getElementById('game-ready');

    if (currentRoom) {
        section.style.display = 'block';
        document.getElementById('room-id-text').textContent = currentRoom.roomId;
        
        if (currentPlayer) {
            document.getElementById('current-player-name').textContent = currentPlayer.username;
            document.getElementById('current-player-color').textContent = `(${currentPlayer.color})`;
        }

        if (opponent) {
            document.getElementById('opponent-name').textContent = opponent.username;
            waitingDiv.style.display = 'none';
            gameReadyDiv.style.display = 'block';
        } else {
            document.getElementById('opponent-name').textContent = 'Aguardando oponente...';
            waitingDiv.style.display = 'block';
            gameReadyDiv.style.display = 'none';
        }
    } else {
        section.style.display = 'none';
    }
}
function leaveCurrentRoom() {
    if (currentRoom && confirm('Deseja realmente sair da sala?')) {
        SocketAPI.leaveRoom(currentRoom.roomId);
        currentRoom = null;
        currentPlayer = null;
        opponent = null;
        document.getElementById('current-room-section').style.display = 'none';
        showMessage('Você saiu da sala', 'info');
        refreshRooms();
    }
}
function startOnlineGame() {
    if (currentRoom && opponent) {
        window.location.href = `tabuleiro-online.html?roomId=${currentRoom.roomId}`;
    } else if (currentRoom) {
        
        window.location.href = `tabuleiro-online.html?roomId=${currentRoom.roomId}`;
    } else {
        showMessage('Você não está em uma sala', 'error');
    }
}
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}
setInterval(refreshRooms, 5000);

let isInQueue = false;
function setupQueueCallbacks() {
    window.onQueueJoined = (data) => {
        isInQueue = true;
        updateQueueStatus(data);
        showMessage(data.message || 'Você entrou na fila de espera', 'success');
    };

    window.onQueueLeft = (data) => {
        isInQueue = false;
        document.getElementById('queue-status').style.display = 'none';
        document.getElementById('queue-btn').textContent = 'Entrar na Fila';
        showMessage(data.message || 'Você saiu da fila', 'info');
    };

    window.onQueueUpdated = (data) => {
        if (isInQueue) {
            document.getElementById('queue-size-number').textContent = data.size;
            
            
        } else {
            document.getElementById('queue-size-number').textContent = data.size;
        }
    };

    window.onMatchFound = (data) => {
        showMessage(`Match encontrado! Oponente: ${data.opponent.username}`, 'success');
        setTimeout(() => {
            window.location.href = `tabuleiro-online.html?roomId=${data.roomId}`;
        }, 1000);
    };
}
function toggleQueue() {
    if (isInQueue) {
        leaveQueue();
    } else {
        joinQueue();
    }
}
function joinQueue() {
    if (currentRoom) {
        if (confirm('Você está em uma sala. Deseja sair e entrar na fila?')) {
            leaveCurrentRoom();
            setTimeout(() => {
                SocketAPI.joinQueue();
                document.getElementById('queue-status').style.display = 'block';
                document.getElementById('queue-btn').textContent = 'Sair da Fila';
            }, 500);
        }
    } else {
        SocketAPI.joinQueue();
        document.getElementById('queue-status').style.display = 'block';
        document.getElementById('queue-btn').textContent = 'Sair da Fila';
    }
}
function leaveQueue() {
    SocketAPI.leaveQueue();
    isInQueue = false;
    document.getElementById('queue-status').style.display = 'none';
    document.getElementById('queue-btn').textContent = 'Entrar na Fila';
}
function updateQueueStatus(data) {
    if (data.position) {
        document.getElementById('queue-position-number').textContent = data.position;
    }
    document.getElementById('queue-status').style.display = 'block';
}

