const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET - Obter perfil do usuário logado
router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Atualizar perfil do usuário logado
router.put('/', requireAuth, async (req, res) => {
    try {
        const { nome, email, idade, foto, pais, estado, cidade } = req.body;
        
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verifica se email já está em uso por outro usuário
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }
        }

        // Atualiza campos
        if (nome !== undefined) user.nome = nome;
        if (email !== undefined) user.email = email;
        if (idade !== undefined) user.idade = idade;
        if (foto !== undefined) user.foto = foto;
        if (pais !== undefined) user.pais = pais;
        if (estado !== undefined) user.estado = estado;
        if (cidade !== undefined) user.cidade = cidade;

        await user.save();

        // Retorna usuário sem senha
        const userResponse = user.toJSON();
        res.json({
            message: 'Perfil atualizado com sucesso',
            user: userResponse
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT - Trocar senha
router.put('/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verifica senha atual
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Senha atual incorreta' });
        }

        // Atualiza senha
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Atualizar username
router.put('/username', requireAuth, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Nome de usuário é obrigatório' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Nome de usuário deve ter entre 3 e 20 caracteres' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verifica se username já está em uso
        if (username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: 'Nome de usuário já está em uso' });
            }
        }

        user.username = username;
        await user.save();

        // Atualiza sessão
        req.session.username = username;

        res.json({
            message: 'Nome de usuário atualizado com sucesso',
            username: user.username
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

