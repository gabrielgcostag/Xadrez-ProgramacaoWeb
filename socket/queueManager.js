// Gerenciador de fila de jogadores
class QueueManager {
    constructor() {
        this.queue = []; // Array de { userId, username, socketId }
    }

    // Adicionar jogador na fila
    addToQueue(userId, username, socketId) {
        // Remove se já está na fila (evita duplicatas)
        this.removeFromQueue(socketId);
        
        this.queue.push({ userId, username, socketId });
        return this.queue.length;
    }

    // Remover jogador da fila
    removeFromQueue(socketId) {
        const index = this.queue.findIndex(p => p.socketId === socketId);
        if (index !== -1) {
            const player = this.queue[index];
            this.queue.splice(index, 1);
            return player;
        }
        return null;
    }

    // Verificar se está na fila
    isInQueue(socketId) {
        return this.queue.some(p => p.socketId === socketId);
    }

    // Obter próximo par de jogadores (matchmaking)
    getNextMatch() {
        if (this.queue.length >= 2) {
            const player1 = this.queue.shift();
            const player2 = this.queue.shift();
            return { player1, player2 };
        }
        return null;
    }

    // Obter tamanho da fila
    getQueueSize() {
        return this.queue.length;
    }

    // Obter todos os jogadores na fila
    getQueuePlayers() {
        return this.queue.map(p => ({
            userId: p.userId,
            username: p.username
        }));
    }
}

module.exports = new QueueManager();
