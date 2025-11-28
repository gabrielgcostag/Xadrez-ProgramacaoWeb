const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET - Buscar o top player (jogador com maior pontuação)
router.get('/top', async (req, res) => {
    try {
        const topPlayer = await User.findOne()
            .sort({ score: -1, highScore: -1 })
            .select('username score highScore wins losses foto')
            .lean();

        if (!topPlayer) {
            return res.json({
                username: 'Nenhum jogador',
                score: 0,
                highScore: 0,
                wins: 0,
                losses: 0
            });
        }

        res.json(topPlayer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Buscar top 10 jogadores
router.get('/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find()
            .sort({ score: -1, highScore: -1 })
            .limit(10)
            .select('username score highScore wins losses foto')
            .lean();

        res.json(topPlayers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Atualizar pontuação após partida (endpoint interno)
router.post('/update-score', async (req, res) => {
    try {
        const { userId, won, date } = req.body;

        if (!userId || typeof won !== 'boolean') {
            return res.status(400).json({ error: 'userId e won são obrigatórios' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Atualiza pontuação
        if (won) {
            user.score += 10;
            user.wins += 1;
        } else {
            // Perde 10 pontos
            user.score -= 10;
            user.losses += 1;
        }

        // Atualiza última data de jogo
        if (date) {
            user.lastGameDate = new Date(date);
        } else {
            user.lastGameDate = new Date();
        }

        await user.save();

        res.json({
            message: 'Pontuação atualizada com sucesso',
            score: user.score,
            highScore: user.highScore,
            wins: user.wins,
            losses: user.losses
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

