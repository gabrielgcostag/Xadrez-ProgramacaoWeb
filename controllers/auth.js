const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireGuest } = require('../middleware/auth');

router.post('/register', requireGuest, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.username === username 
                    ? 'Nome de usuário já está em uso' 
                    : 'Email já está em uso' 
            });
        }

        const user = new User({ username, email, password });
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', requireGuest, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios' });
        }

        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

   
        user.lastLogin = Date.now();
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout realizado com sucesso' });
    });
});

router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
