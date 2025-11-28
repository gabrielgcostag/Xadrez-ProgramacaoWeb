
class QueueManager {
    constructor() {
        this.queue = []; 
    }

    
    addToQueue(userId, username, socketId) {
        
        this.removeFromQueue(socketId);
        
        this.queue.push({ userId, username, socketId });
        return this.queue.length;
    }

    
    removeFromQueue(socketId) {
        const index = this.queue.findIndex(p => p.socketId === socketId);
        if (index !== -1) {
            const player = this.queue[index];
            this.queue.splice(index, 1);
            return player;
        }
        return null;
    }

    
    isInQueue(socketId) {
        return this.queue.some(p => p.socketId === socketId);
    }

    
    getNextMatch() {
        if (this.queue.length >= 2) {
            const player1 = this.queue.shift();
            const player2 = this.queue.shift();
            return { player1, player2 };
        }
        return null;
    }

    
    getQueueSize() {
        return this.queue.length;
    }

    
    getQueuePlayers() {
        return this.queue.map(p => ({
            userId: p.userId,
            username: p.username
        }));
    }
}

module.exports = new QueueManager();
