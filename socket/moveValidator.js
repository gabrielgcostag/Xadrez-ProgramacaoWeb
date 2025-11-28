class ServerMoveValidator {
    constructor() {
        
        this.gameStates = new Map();
    }

    
    validateMove(room, fromRow, fromCol, toRow, toCol) {
        
        if (fromRow < 1 || fromRow > 8 || fromCol < 1 || fromCol > 8) {
            return { valid: false, error: 'Posição de origem inválida' };
        }

        if (toRow < 1 || toRow > 8 || toCol < 1 || toCol > 8) {
            return { valid: false, error: 'Posição de destino inválida' };
        }

        if (fromRow === toRow && fromCol === toCol) {
            return { valid: false, error: 'Movimento inválido: mesma posição' };
        }

        
        const player = room.getPlayer(this.socketId);
        if (!player) {
            return { valid: false, error: 'Jogador não encontrado na sala' };
        }

        if (room.gameState.currentPlayer !== player.color) {
            return { valid: false, error: 'Não é sua vez de jogar' };
        }

        
        
        

        return { valid: true };
    }

    
    
    reconstructBoard(moveHistory) {
        
        return null;
    }
}

module.exports = new ServerMoveValidator();

