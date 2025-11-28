// Gerenciador de tema Dark/Light
class ThemeManager {
    constructor() {
        this.themeKey = 'chess-app-theme';
        this.init();
    }

    init() {
        // Esperar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadTheme());
        } else {
            this.loadTheme();
        }
    }

    loadTheme() {
        // Verificar se o tema já foi aplicado pelo script inline
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        const theme = htmlTheme || localStorage.getItem(this.themeKey) || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        // Aplicar tema no body quando estiver disponível
        if (document.body) {
            this.setTheme(theme);
            
            // Remover estilo crítico após CSS carregar (pequeno delay)
            setTimeout(() => {
                const criticalStyle = document.getElementById('critical-theme-style');
                if (criticalStyle) {
                    criticalStyle.remove();
                }
            }, 100);
        } else {
            // Aguardar body estar disponível
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
        
        // Atualizar botão após um pequeno delay para garantir que o DOM está pronto
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
        // Se nenhuma classe, verificar localStorage ou usar padrão
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
                    icon.textContent = '☀️'; // Sol para dark mode
                    icon.setAttribute('title', 'Tema claro');
                } else {
                    icon.textContent = '🌙'; // Lua para light mode
                    icon.setAttribute('title', 'Tema escuro');
                }
            }
        });
    }
}

// Criar instância global
const themeManager = new ThemeManager();

// Função global para alternar tema (chamada pelo botão)
function toggleTheme() {
    themeManager.toggleTheme();
}

