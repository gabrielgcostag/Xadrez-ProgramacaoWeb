const getAPIBaseURL = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    let port = window.location.port;
    if (!port || port === '') {
        port = '3000';
    }
    const url = `${protocol}//${hostname}:${port}/api`;
    return url;
};

const API_BASE_URL = getAPIBaseURL();
// Disponibilizar globalmente para outros scripts
window.API_BASE_URL = API_BASE_URL;

if (typeof window.apiRequest === 'undefined') {
    window.apiRequest = async function(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include',
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    };
}

const GameAPI = {
    // Criar uma nova partida
    async createGame(gameData) {
        return await window.apiRequest('/games', {
            method: 'POST',
            body: JSON.stringify(gameData)
        });
    },

    // Buscar uma partida por ID
    async getGame(gameId) {
        return await window.apiRequest(`/games/${gameId}`);
    },

    // Listar todas as partidas do usuário
    async getAllGames() {
        return await window.apiRequest('/games');
    },

    // Atualizar uma partida
    async updateGame(gameId, gameData) {
        return await window.apiRequest(`/games/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify(gameData)
        });
    },

    // Adicionar um movimento a uma partida
    async addMove(gameId, moveData) {
        return await window.apiRequest(`/games/${gameId}/moves`, {
            method: 'POST',
            body: JSON.stringify(moveData)
        });
    },

    // Deletar uma partida
    async deleteGame(gameId) {
        return await window.apiRequest(`/games/${gameId}`, {
            method: 'DELETE'
        });
    },

    // Buscar partidas finalizadas
    async getFinishedGames() {
        return await window.apiRequest('/games/finished/all');
    }
};

// Função para serializar o estado do tabuleiro
function serializeBoardState(game) {
    const boardState = [];
    for (let row = 1; row <= 8; row++) {
        for (let col = 1; col <= 8; col++) {
            const piece = game.getPiece(row, col);
            if (piece) {
                boardState.push({
                    row,
                    col,
                    type: piece.constructor.name,
                    color: piece.color
                });
            }
        }
    }
    return JSON.stringify(boardState);
}

// Função para salvar o estado atual da partida
async function saveGameState(game, gameId = null) {
    try {
        const gameData = {
            gameMode: gameMode,
            aiDifficulty: aiDifficulty,
            currentPlayer: game.currentPlayer,
            gameState: game.gameState,
            boardState: serializeBoardState(game),
            moveHistory: game.moveHistory.map(move => ({
                fromRow: move.fromRow,
                fromCol: move.fromCol,
                toRow: move.toRow,
                toCol: move.toCol,
                piece: move.piece || '',
                capturedPiece: move.capturedPiece || null
            })),
            capturedPieces: {
                branco: game.capturedPieces.branco.map(p => p.constructor.name),
                preto: game.capturedPieces.preto.map(p => p.constructor.name)
            }
        };

        if (gameId) {
            // Atualiza partida existente
            return await GameAPI.updateGame(gameId, gameData);
        } else {
            // Cria nova partida
            return await GameAPI.createGame(gameData);
        }
    } catch (error) {
        return null;
    }
}

// Função para salvar um movimento
async function saveMove(game, gameId, fromRow, fromCol, toRow, toCol, capturedPiece = null) {
    if (!gameId) return null;

    try {
        const piece = game.getPiece(toRow, toCol);
        const moveData = {
            fromRow,
            fromCol,
            toRow,
            toCol,
            piece: piece ? piece.constructor.name : '',
            capturedPiece: capturedPiece ? capturedPiece.constructor.name : null,
            currentPlayer: game.currentPlayer,
            gameState: game.gameState,
            boardState: serializeBoardState(game),
            capturedPieces: {
                branco: game.capturedPieces.branco.map(p => p.constructor.name),
                preto: game.capturedPieces.preto.map(p => p.constructor.name)
            }
        };

        // Se o jogo terminou, adiciona o vencedor
        if (game.gameState === 'checkmate') {
            moveData.winner = game.currentPlayer === 'branco' ? 'preto' : 'branco';
        }

        return await GameAPI.addMove(gameId, moveData);
    } catch (error) {
        return null;
    }
}

