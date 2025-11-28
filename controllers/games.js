const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const { requireAuth } = require('../middleware/auth');
router.get('/', requireAuth, async (req, res) => {
    try {
        const games = await Game.find({ userId: req.session.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const game = await Game.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });
        
        if (!game) {
            return res.status(404).json({ error: 'Partida não encontrada' });
        }
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/', requireAuth, async (req, res) => {
    try {
        const game = new Game({
            userId: req.session.userId,
            gameMode: req.body.gameMode || 'human-vs-human',
            aiDifficulty: req.body.aiDifficulty || 7,
            currentPlayer: req.body.currentPlayer || 'branco',
            gameState: req.body.gameState || 'playing',
            boardState: req.body.boardState || '',
            moveHistory: req.body.moveHistory || [],
            capturedPieces: req.body.capturedPieces || { branco: [], preto: [] }
        });

        const savedGame = await game.save();
        res.status(201).json(savedGame);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const game = await Game.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.session.userId
            },
            {
                ...req.body,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!game) {
            return res.status(404).json({ error: 'Partida não encontrada' });
        }

        res.json(game);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/:id/moves', requireAuth, async (req, res) => {
    try {
        const game = await Game.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });
        
        if (!game) {
            return res.status(404).json({ error: 'Partida não encontrada' });
        }

        const move = {
            fromRow: req.body.fromRow,
            fromCol: req.body.fromCol,
            toRow: req.body.toRow,
            toCol: req.body.toCol,
            piece: req.body.piece,
            capturedPiece: req.body.capturedPiece || null
        };

        game.moveHistory.push(move);
        game.currentPlayer = req.body.currentPlayer || game.currentPlayer;
        game.gameState = req.body.gameState || game.gameState;
        game.boardState = req.body.boardState || game.boardState;
        
        if (req.body.capturedPieces) {
            game.capturedPieces = req.body.capturedPieces;
        }

        
        if (req.body.gameState === 'checkmate' || req.body.gameState === 'stalemate') {
            game.finishedAt = Date.now();
            if (req.body.gameState === 'checkmate') {
                game.winner = req.body.winner || (game.currentPlayer === 'branco' ? 'preto' : 'branco');
            } else if (req.body.gameState === 'stalemate') {
                game.winner = 'draw';
            }
        }

        const updatedGame = await game.save();
        res.json(updatedGame);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const game = await Game.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.userId
        });
        
        if (!game) {
            return res.status(404).json({ error: 'Partida não encontrada' });
        }
        res.json({ message: 'Partida deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/finished/all', requireAuth, async (req, res) => {
    try {
        const games = await Game.find({
            userId: req.session.userId,
            gameState: { $in: ['checkmate', 'stalemate', 'draw'] }
        })
        .sort({ finishedAt: -1 })
        .limit(20);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
