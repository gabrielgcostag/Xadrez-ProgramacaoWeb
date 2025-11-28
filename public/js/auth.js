const getAPIBaseURL = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    let port = window.location.port;
    
    let url;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (!port || port === '') {
            port = '3000';
        }
        url = `${protocol}//${hostname}:${port}/api`;
    } else {
        if (port && port !== '') {
            url = `${protocol}//${hostname}:${port}/api`;
        } else {
            url = `${protocol}//${hostname}/api`;
        }
    }
    
    window.API_BASE_URL = url;
    return url;
};

window.apiRequest = async function apiRequest(endpoint, options = {}) {
    try {
        const apiBase = getAPIBaseURL();
        const fullUrl = `${apiBase}${endpoint}`;
        const response = await fetch(fullUrl, {
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

const apiRequest = window.apiRequest;

const AuthAPI = {
    async login(username, password) {
        return await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    async register(username, email, password) {
        return await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    },

    async logout() {
        return await apiRequest('/auth/logout', {
            method: 'POST'
        });
    },

    async checkAuth() {
        return await apiRequest('/auth/me');
    }
};

function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('login-content').classList.add('active');
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('register-content').classList.add('active');
    }
    
    hideMessages();
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    document.getElementById('error-message').style.display = 'none';
}

function hideMessages() {
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    hideMessages();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const result = await AuthAPI.login(username, password);
        showSuccess('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showError(error.message || 'Erro ao fazer login');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    hideMessages();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const result = await AuthAPI.register(username, email, password);
        showSuccess('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showError(error.message || 'Erro ao fazer cadastro');
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const auth = await AuthAPI.checkAuth();
        if (auth.authenticated) {
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
    }
});
