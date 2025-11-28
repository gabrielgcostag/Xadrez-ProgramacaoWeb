
const ProfileAPI = {
    
    async getProfile() {
        const requestFn = window.apiRequest || apiRequest;
        if (typeof requestFn === 'undefined') {
            throw new Error('apiRequest não está disponível. Certifique-se de que auth.js está carregado.');
        }
        return await requestFn('/profile', {
            method: 'GET'
        });
    },

    
    async updateProfile(profileData) {
        const requestFn = window.apiRequest || apiRequest;
        return await requestFn('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    
    async changePassword(currentPassword, newPassword) {
        const requestFn = window.apiRequest || apiRequest;
        return await requestFn('/profile/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    
    async updateUsername(username) {
        const requestFn = window.apiRequest || apiRequest;
        return await requestFn('/profile/username', {
            method: 'PUT',
            body: JSON.stringify({ username })
        });
    }
};
let currentProfile = null;
let avatarBase64 = null;
document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        const auth = await AuthAPI.checkAuth();
        if (!auth.authenticated) {
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        window.location.href = 'login.html';
        return;
    }

    await loadProfile();
    
    if (typeof window.updateHeaderAvatar === 'function') {
        window.updateHeaderAvatar();
    }
});
async function loadProfile() {
    try {
        const profile = await ProfileAPI.getProfile();
        currentProfile = profile;
        
        
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
        
        
        const avatarImage = document.getElementById('avatar-image');
        const avatarInitial = document.getElementById('avatar-initial');
        
        if (avatarImage && avatarInitial) {
            if (profile.foto) {
                avatarImage.src = profile.foto;
                avatarImage.style.display = 'block';
                avatarInitial.style.display = 'none';
                avatarBase64 = profile.foto;
            } else {
                
                const initial = profile.username ? profile.username.charAt(0).toUpperCase() : '?';
                avatarInitial.textContent = initial;
            }
        }
        
        
        if (typeof window.updateHeaderAvatar === 'function') {
            window.updateHeaderAvatar();
        }
    } catch (error) {
        
        if (typeof showMessage === 'function') {
            showMessage('Erro ao carregar perfil: ' + error.message, 'error');
        }
    }
}
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
    
    
    if (avatarBase64) {
        formData.foto = avatarBase64;
    }
    
    try {
        
        if (formData.username !== currentProfile.username) {
            await ProfileAPI.updateUsername(formData.username);
            delete formData.username;
        }
        
        
        if (Object.keys(formData).length > 0) {
            await ProfileAPI.updateProfile(formData);
        }
        
        showMessage('Perfil atualizado com sucesso!', 'success');
        await loadProfile(); 
    } catch (error) {
        showMessage('Erro ao atualizar perfil: ' + error.message, 'error');
    }
}
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
const avatarInput = document.getElementById('avatar-input');
if (avatarInput) {
    avatarInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showMessage('Por favor, selecione uma imagem!', 'error');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) { 
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
async function handleLogout() {
    if (confirm('Deseja realmente sair da sua conta?')) {
        try {
            await AuthAPI.logout();
            window.location.href = 'login.html';
        } catch (error) {
            window.location.href = 'login.html';
        }
    }
}
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

