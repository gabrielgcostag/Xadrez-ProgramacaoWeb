const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { requireAuth } = require('../middleware/auth');
const roomManager = require('../../socket/roomManager');
router.get('/available', requireAuth, async (req, res) => {
    try {
        const rooms = await roomManager.getAvailableRooms();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:roomId', requireAuth, async (req, res) => {
    try {
        const room = await roomManager.getRoom(req.params.roomId);
        
        if (!room) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }

        
        const isPlayer = (room.player1 && room.player1.userId.toString() === req.session.userId.toString()) ||
                        (room.player2 && room.player2.userId.toString() === req.session.userId.toString());

        if (!isPlayer) {
            return res.status(403).json({ error: 'Você não está nesta sala' });
        }

        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/history/my', requireAuth, async (req, res) => {
    try {
        const rooms = await Room.find({
            $or: [
                { 'player1.userId': req.session.userId },
                { 'player2.userId': req.session.userId }
            ],
            status: { $in: ['finished', 'abandoned'] }
        })
        .populate('player1.userId', 'username')
        .populate('player2.userId', 'username')
        .populate('winner', 'username')
        .sort({ finishedAt: -1 })
        .limit(20);

        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

