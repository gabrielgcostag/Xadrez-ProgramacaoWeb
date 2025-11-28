// Middleware para verificar se o usuário está autenticado
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Acesso negado. Faça login para continuar.' });
};

// Middleware para verificar se o usuário NÃO está autenticado (para páginas de login/cadastro)
const requireGuest = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.status(403).json({ error: 'Você já está logado.' });
    }
    next();
};

module.exports = { requireAuth, requireGuest };
