
class ThemeManager {
    constructor() {
        this.themeKey = 'chess-app-theme';
        this.init();
    }

    init() {
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadTheme());
        } else {
            this.loadTheme();
        }
    }

    loadTheme() {
        
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        const theme = htmlTheme || localStorage.getItem(this.themeKey) || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        
        if (document.body) {
            this.setTheme(theme);
            
            
            setTimeout(() => {
                const criticalStyle = document.getElementById('critical-theme-style');
                if (criticalStyle) {
                    criticalStyle.remove();
                }
            }, 100);
        } else {
            
            const observer = new MutationObserver(() => {
                if (document.body) {
                    this.setTheme(theme);
                    setTimeout(() => {
                        const criticalStyle = document.getElementById('critical-theme-style');
                        if (criticalStyle) {
                            criticalStyle.remove();
                        }
                    }, 100);
                    observer.disconnect();
                }
            });
            observer.observe(document.documentElement, { childList: true });
        }
    }

    setTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
        localStorage.setItem(this.themeKey, theme);
        
        
        setTimeout(() => this.updateThemeButton(), 50);
    }

    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        if (document.body.classList.contains('dark-theme')) {
            return 'dark';
        } else if (document.body.classList.contains('light-theme')) {
            return 'light';
        }
        
        const savedTheme = localStorage.getItem(this.themeKey);
        return savedTheme || 'light';
    }

    updateThemeButton() {
        const themeButtons = document.querySelectorAll('.theme-toggle-btn');
        const currentTheme = this.getCurrentTheme();
        
        themeButtons.forEach(btn => {
            const icon = btn.querySelector('.theme-icon');
            if (icon) {
                if (currentTheme === 'dark') {
                    icon.textContent = '☀️'; 
                    icon.setAttribute('title', 'Tema claro');
                } else {
                    icon.textContent = '🌙'; 
                    icon.setAttribute('title', 'Tema escuro');
                }
            }
        });
    }
}
const themeManager = new ThemeManager();
function toggleTheme() {
    themeManager.toggleTheme();
}

