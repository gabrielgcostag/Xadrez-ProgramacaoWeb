document.addEventListener('DOMContentLoaded', async () => {
    try {
        const auth = await AuthAPI.checkAuth();
        const loginLink = document.getElementById('login-link');
        const mobileLoginLink = document.getElementById('mobile-login-link');
        const avatarNav = document.getElementById('user-avatar-nav');
        const mobileProfileLink = document.getElementById('mobile-profile-link');
        const headerAvatar = document.getElementById('header-avatar');
        
        if (auth.authenticated) {
            // Esconde link de login
            if (loginLink) loginLink.style.display = 'none';
            if (mobileLoginLink) mobileLoginLink.style.display = 'none';
            
            // Mostra avatar e link de perfil
            if (avatarNav) avatarNav.style.display = 'inline-block';
            if (mobileProfileLink) mobileProfileLink.style.display = 'block';
            
            // Carrega perfil para mostrar avatar
            try {
                const profile = await ProfileAPI.getProfile();
                if (headerAvatar) {
                    if (profile.foto) {
                        headerAvatar.innerHTML = `<img src="${profile.foto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    } else {
                        const initial = profile.username ? profile.username.charAt(0).toUpperCase() : '?';
                        headerAvatar.textContent = initial;
                    }
                }
            } catch (error) {
                // Mostra avatar mesmo se não conseguir carregar perfil
                if (avatarNav) avatarNav.style.display = 'inline-block';
                if (mobileProfileLink) mobileProfileLink.style.display = 'block';
            }
        } else {
            // Não está logado - mostra login, esconde perfil
            if (loginLink) loginLink.style.display = 'block';
            if (mobileLoginLink) mobileLoginLink.style.display = 'block';
            if (avatarNav) avatarNav.style.display = 'none';
            if (mobileProfileLink) mobileProfileLink.style.display = 'none';
        }
    } catch (error) {
        // Se houver erro, assume que não está logado
        const loginLink = document.getElementById('login-link');
        const mobileLoginLink = document.getElementById('mobile-login-link');
        const avatarNav = document.getElementById('user-avatar-nav');
        const mobileProfileLink = document.getElementById('mobile-profile-link');
        
        if (loginLink) loginLink.style.display = 'block';
        if (mobileLoginLink) mobileLoginLink.style.display = 'block';
        if (avatarNav) avatarNav.style.display = 'none';
        if (mobileProfileLink) mobileProfileLink.style.display = 'none';
    }
});

// Função para toggle do menu mobile (exceto na home)
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('open');
    }
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.remove('open');
    }
}

