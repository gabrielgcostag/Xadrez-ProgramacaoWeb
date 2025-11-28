
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const auth = await AuthAPI.checkAuth();
        const loginLink = document.getElementById('login-link');
        const mobileLoginLink = document.getElementById('mobile-login-link');
        const avatarNav = document.getElementById('user-avatar-nav');
        const mobileProfileLink = document.getElementById('mobile-profile-link');
        const headerAvatar = document.getElementById('header-avatar');
        
        if (auth.authenticated) {
            
            if (loginLink) loginLink.style.display = 'none';
            if (mobileLoginLink) mobileLoginLink.style.display = 'none';
            
            
            if (avatarNav) avatarNav.style.display = 'inline-block';
            if (mobileProfileLink) mobileProfileLink.style.display = 'block';
            
            
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
                
                if (avatarNav) avatarNav.style.display = 'inline-block';
                if (mobileProfileLink) mobileProfileLink.style.display = 'block';
            }
        } else {
            
            if (loginLink) loginLink.style.display = 'block';
            if (mobileLoginLink) mobileLoginLink.style.display = 'block';
            if (avatarNav) avatarNav.style.display = 'none';
            if (mobileProfileLink) mobileProfileLink.style.display = 'none';
        }
    } catch (error) {
        
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

