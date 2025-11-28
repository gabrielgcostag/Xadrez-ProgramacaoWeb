# Xadrez - Jogo de Xadrez Online

Um jogo de xadrez completo desenvolvido em Node.js com suporte para jogos locais e online em tempo real. O projeto inclui sistema de autenticação, ranking, perfis de usuário e múltiplos temas visuais.

## Funcionalidades

- **Jogos Locais**: Jogue contra você mesmo ou contra a IA
- **Jogos Online**: Partidas em tempo real com outros jogadores usando Socket.io
- **Sistema de Autenticação**: Registro e login de usuários com sessões seguras
- **Perfis de Usuário**: Visualize e edite seu perfil, estatísticas e histórico
- **Sistema de Ranking**: Classificação de jogadores baseada em vitórias e pontuação
- **Salas de Jogo**: Crie ou entre em salas para jogar com outros usuários
- **Múltiplos Temas**: Escolha entre diferentes temas visuais (Clássico, Madeira, Vidro)
- **Histórico de Partidas**: Acompanhe todas as suas partidas jogadas

## Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **Banco de Dados**: MongoDB com Mongoose
- **Tempo Real**: Socket.io
- **Autenticação**: Express-session, bcryptjs
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [MongoDB](https://www.mongodb.com/try/download/community) (local ou Atlas)
- [npm](https://www.npmjs.com/) (geralmente vem com Node.js)
- [Git](https://git-scm.com/) (para clonar o repositório)

## Como Rodar o Projeto

### 1. Clone o repositório

```bash
git clone <url-do-repositório>
cd Xadrez-ProgramacaoWeb
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Porta do servidor (padrão: 3000)
PORT=3000

# URI de conexão do MongoDB
MONGODB_URI=mongodb://localhost:27017/xadrez

```


##  Como Contribuir

Contribuições são bem-vindas! Siga os passos abaixo:

### 1. Fork o projeto

Faça um fork do repositório para sua conta no GitHub.

### 2. Crie uma branch para sua feature

```bash
git checkout -b feature/nova-funcionalidade
```

ou para correção de bugs:

```bash
git checkout -b fix/correcao-bug
```

### 3. Faça suas alterações

- Escreva código limpo e bem documentado
- Siga o padrão de código existente no projeto
- Adicione comentários quando necessário
- Teste suas alterações antes de commitar

### 4. Commit suas alterações

Use mensagens de commit descritivas:

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade X"
```

**Convenção de commits**:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação, ponto e vírgula faltando, etc
- `refactor:` - Refatoração de código
- `test:` - Adição de testes
- `chore:` - Mudanças em build, dependências, etc

### 5. Push para sua branch

```bash
git push origin feature/nova-funcionalidade
```

### 6. Abra um Pull Request

Vá até o repositório original no GitHub e abra um Pull Request descrevendo suas alterações.

### Diretrizes de Contribuição

- Mantenha o código consistente com o estilo existente
- Adicione testes quando possível
- Atualize a documentação se necessário
- Certifique-se de que o código funciona antes de fazer o PR
- Seja respeitoso e construtivo em comentários e discussões

##  Reportando Bugs

Se encontrar um bug, por favor:

1. Verifique se o bug já não foi reportado nas Issues
2. Crie uma nova Issue descrevendo:
   - Passos para reproduzir o bug
   - Comportamento esperado
   - Comportamento atual
   - Ambiente (SO, versão do Node.js, etc)
   - Screenshots se aplicável

---

**Nota**: Este é um projeto acadêmico desenvolvido para a disciplina de Programação Web.
