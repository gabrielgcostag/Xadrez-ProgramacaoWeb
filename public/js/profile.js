// API de Perfil (usa apiRequest de auth.js)
const ProfileAPI = {
    // Obter perfil do usuário
    async getProfile() {
        const requestFn = window.apiRequest || apiRequest;
        if (typeof requestFn === 'undefined') {
            throw new Error('apiRequest não está disponível. Certifique-se de que auth.js está carregado.');
        }
        return await requestFn('/profile', {
            method: 'GET'
        });
    },

    // Atualizar perfil
    async updateProfile(profileData) {
        const requestFn = window.apiRequest || apiRequest;
        return await requestFn('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    // Trocar senha
    async changePassword(currentPassword, newPassword) {
        const requestFn = window.apiRequest || apiRequest;
        return await requestFn('/profile/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    // Atualizar username
    async updateUsername(username) {
        const requestFn = window.apiRequest || apiRequest;
        return await requestFn('/profile/username', {
            method: 'PUT',
            body: JSON.stringify({ username })
        });
    }
};

// Funções da página de perfil
let currentProfile = null;
let avatarBase64 = null;

// Carregar perfil ao abrir a página
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    try {
        const auth = await AuthAPI.checkAuth();
        if (!auth.authenticated) {
            window.location.href = '/login.html';
            return;
        }
    } catch (error) {
        window.location.href = '/login.html';
        return;
    }

    await loadProfile();
    // Só atualiza avatar se a função estiver disponível
    if (typeof window.updateHeaderAvatar === 'function') {
        window.updateHeaderAvatar();
    }
});

// Carregar dados do perfil
async function loadProfile() {
    try {
        const profile = await ProfileAPI.getProfile();
        currentProfile = profile;
        
        // Preencher formulário (só se os elementos existirem - página de perfil)
        const usernameEl = document.getElementById('username');
        const emailEl = document.getElementById('email');
        const nomeEl = document.getElementById('nome');
        const idadeEl = document.getElementById('idade');
        const paisEl = document.getElementById('pais');
        const estadoEl = document.getElementById('estado');
        const cidadeEl = document.getElementById('cidade');
        
        if (usernameEl) usernameEl.value = profile.username || '';
        if (emailEl) emailEl.value = profile.email || '';
        if (nomeEl) nomeEl.value = profile.nome || '';
        if (idadeEl) idadeEl.value = profile.idade || '';
        if (paisEl) paisEl.value = profile.pais || '';
        if (estadoEl) estadoEl.value = profile.estado || '';
        if (cidadeEl) cidadeEl.value = profile.cidade || '';
        
        // Carregar avatar (só se os elementos existirem)
        const avatarImage = document.getElementById('avatar-image');
        const avatarInitial = document.getElementById('avatar-initial');
        
        if (avatarImage && avatarInitial) {
            if (profile.foto) {
                avatarImage.src = profile.foto;
                avatarImage.style.display = 'block';
                avatarInitial.style.display = 'none';
                avatarBase64 = profile.foto;
            } else {
                // Mostrar inicial do nome
                const initial = profile.username ? profile.username.charAt(0).toUpperCase() : '?';
                avatarInitial.textContent = initial;
            }
        }
        
        // Atualizar avatar no header se a função estiver disponível
        if (typeof window.updateHeaderAvatar === 'function') {
            window.updateHeaderAvatar();
        }
    } catch (error) {
        // Só mostra mensagem se a função showMessage existir (página de perfil)
        if (typeof showMessage === 'function') {
            showMessage('Erro ao carregar perfil: ' + error.message, 'error');
        }
    }
}

// Atualizar perfil
async function handleUpdateProfile(event) {
    event.preventDefault();
    hideMessage();
    
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        nome: document.getElementById('nome').value,
        idade: document.getElementById('idade').value ? parseInt(document.getElementById('idade').value) : undefined,
        pais: document.getElementById('pais').value,
        estado: document.getElementById('estado').value,
        cidade: document.getElementById('cidade').value
    };
    
    // Adicionar foto se foi alterada
    if (avatarBase64) {
        formData.foto = avatarBase64;
    }
    
    try {
        // Se username mudou, atualizar separadamente
        if (formData.username !== currentProfile.username) {
            await ProfileAPI.updateUsername(formData.username);
            delete formData.username;
        }
        
        // Atualizar resto do perfil
        if (Object.keys(formData).length > 0) {
            await ProfileAPI.updateProfile(formData);
        }
        
        showMessage('Perfil atualizado com sucesso!', 'success');
        await loadProfile(); // Recarregar para pegar dados atualizados
    } catch (error) {
        showMessage('Erro ao atualizar perfil: ' + error.message, 'error');
    }
}

// Trocar senha
async function handleChangePassword(event) {
    event.preventDefault();
    hideMessage();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        showMessage('As senhas não coincidem!', 'error');
        return;
    }
    
    try {
        await ProfileAPI.changePassword(currentPassword, newPassword);
        showMessage('Senha alterada com sucesso!', 'success');
        document.getElementById('password-form').reset();
    } catch (error) {
        showMessage('Erro ao alterar senha: ' + error.message, 'error');
    }
}

// Upload de avatar (só se o elemento existir - página de perfil)
const avatarInput = document.getElementById('avatar-input');
if (avatarInput) {
    avatarInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showMessage('Por favor, selecione uma imagem!', 'error');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB
        showMessage('A imagem deve ter no máximo 2MB!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        avatarBase64 = e.target.result;
        document.getElementById('avatar-image').src = avatarBase64;
        document.getElementById('avatar-image').style.display = 'block';
        document.getElementById('avatar-initial').style.display = 'none';
        if (typeof updateHeaderAvatar === 'function') {
            updateHeaderAvatar();
        }
    };
    reader.readAsDataURL(file);
    });
}

// Atualizar avatar no header (função global para uso em outras páginas)
window.updateHeaderAvatar = function() {
    const headerAvatar = document.getElementById('header-avatar');
    const avatarNav = document.getElementById('user-avatar-nav');
    
    if (!headerAvatar || !avatarNav) return;
    
    if (currentProfile) {
        avatarNav.style.display = 'inline-block';
        
        if (currentProfile.foto) {
            headerAvatar.innerHTML = `<img src="${currentProfile.foto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const initial = currentProfile.username ? currentProfile.username.charAt(0).toUpperCase() : '?';
            headerAvatar.textContent = initial;
        }
    }
};

// Logout
async function handleLogout() {
    if (confirm('Deseja realmente sair da sua conta?')) {
        try {
            await AuthAPI.logout();
            window.location.href = '/login.html';
        } catch (error) {
            window.location.href = '/login.html';
        }
    }
}

// Funções auxiliares
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(hideMessage, 3000);
    }
}

function hideMessage() {
    document.getElementById('message').style.display = 'none';
}

