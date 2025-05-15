# Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG)

Este é um sistema web robusto para gerenciar torneios de sinuca, permitindo o acompanhamento de chaveamentos, registro de placares e administração completa de jogadores e torneios. Utiliza Node.js, Express e SQLite como banco de dados principal.

## Funcionalidades Principais

- **Visualização de Chaveamento:** Exibe o chaveamento atual do torneio em formato de eliminatória simples ou dupla.
- **Histórico de Placares:** Mostra uma tabela com todos os placares registrados para o torneio.
- **Painel Administrativo Seguro:** Área protegida por autenticação para gerenciamento completo:
  - **Dashboard:** Resumo com informações relevantes e estatísticas.
  - **Gerenciamento de Torneios:** Criação, edição, e gerenciamento do ciclo de vida dos torneios (Pendente, Em Andamento, Concluído, Cancelado). Inclui definição de nome, data, descrição, número de jogadores, tipo de chaveamento, taxa de inscrição, premiação e regras.
  - **Gerenciamento de Jogadores:** Adição, edição, exclusão e importação em massa de jogadores (via JSON) para torneios.
  - **Geração de Chaveamento:** Geração automática do chaveamento com base nos jogadores inscritos.
  - **Agendamento de Partidas:** Definição de data e hora para partidas.
  - **Gerenciamento de Placares:** Adição e edição de placares.
  - **Lixeira de Torneios:** Funcionalidade para mover torneios para a lixeira, restaurá-los ou excluí-los permanentemente.
- **Seleção de Torneios:** Interface para selecionar e visualizar diferentes torneios.
- **Design Responsivo e Temas:** Interface adaptável com temas claro e escuro, com persistência da preferência do usuário.
- **Feedback Visual:** Indicadores de carregamento e mensagens de status.
- **Acessibilidade:** Melhorias para navegação por teclado, textos alternativos para imagens e uso de atributos ARIA.
- **Segurança Avançada:**
  - Proteção contra XSS (Cross-Site Scripting).
  - Prevenção de CSRF (Cross-Site Request Forgery) com tokens.
  - Headers de segurança HTTP configurados via Helmet.
  - Rate limiting para proteger contra ataques de força bruta.
  - Uso de cookies seguros (HttpOnly, Secure, SameSite).
  - Mecanismo de Honeypot para detecção de bots.
- **Persistência de Dados:** Todos os dados são armazenados em um banco de dados SQLite, utilizando `better-sqlite3` para melhor performance.

## Configuração e Execução

### 1. Pré-requisitos

- Node.js (v16.x ou superior recomendado)
- npm (geralmente incluído com Node.js)

### 2. Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd lascmmg

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env e defina as variáveis, especialmente:
# PORT (ex: 3000)
# COOKIE_SECRET (uma string longa e aleatória para segurança das sessões)
# JWT_SECRET (uma string longa e aleatória para tokens JWT)
# JWT_EXPIRATION (ex: 1h, 7d)
# JWT_ISSUER (ex: lascmmg.com)
# JWT_AUDIENCE (ex: lascmmg.com)
# CORS_ORIGIN (domínio permitido em produção, ex: https://seusite.com)
```

**Importante:** `COOKIE_SECRET` e `JWT_SECRET` devem ser valores fortes e únicos para ambientes de produção.

### 3. Inicialização do Banco de Dados e Administrador

- Ao iniciar o servidor pela primeira vez, o banco de dados SQLite (`data/data.db`) será criado automaticamente, e as tabelas serão inicializadas.
- **Primeiro Administrador:**

  - Use o script `scripts/initialize_admin.js` para criar o primeiro usuário administrador. Execute:

    ```bash
    node scripts/initialize_admin.js --username seu_usuario --password sua_senha_forte
    ```

  - Alternativamente, o sistema de migração de `admin_credentials.json` (se o arquivo existir na raiz e o admin não estiver no banco) tentará criar o usuário no primeiro login bem-sucedido com as credenciais do arquivo. Recomenda-se remover `admin_credentials.json` após a configuração inicial no banco.

### 4. Execução

- **Modo de Desenvolvimento (com reinício automático):**

  ```bash
  npm run dev
  ```

- **Modo de Produção:**

  ```bash
  npm start
  ```

- O servidor será iniciado na porta definida em `.env` (padrão `3000`).
- Acesse `http://localhost:[PORTA]` para a interface pública e `http://localhost:[PORTA]/admin.html` para o painel administrativo.

### 5. Scripts NPM Disponíveis

- `npm start`: Inicia o servidor em modo produção.
- `npm run dev`: Inicia o servidor com `nodemon` para desenvolvimento.
- `npm test`: Executa os testes unitários com Vitest.
- `npm run test:watch`: Executa os testes unitários em modo de observação.
- `npm run lint`: Executa a verificação de código com ESLint.
- `npm run lint:fix`: Tenta corrigir automaticamente problemas de ESLint.
- `npm run format`: Formata o código com Prettier.

## Testes

- O projeto utiliza [Vitest](https://vitest.dev/) para testes unitários.
- Os arquivos de teste estão localizados em `tests/`.
- A configuração do Vitest está em `vitest.config.js`, utilizando `jsdom` para simular o ambiente do navegador.
- Para executar os testes:

  ```bash
  npm test
  ```

  Ou, para execução direta (caso `npm test` tenha problemas de cache):

  ```bash
  npx vitest run
  ```

## Arquitetura do Sistema

### Backend (Node.js/Express)

- **API RESTful**: Endpoints para todas as operações do sistema.
- **Middleware de Autenticação**: JWT para proteger rotas, com blacklist de tokens em memória e proteção contra brute-force.
- **Persistência de Dados**: SQLite, acessado via `better-sqlite3`.
- **Modelos de Dados**: (`lib/models/`) Abstraem o acesso ao banco de dados para cada entidade.
- **Estrutura de Rotas**: (`routes/`) Módulos dedicados para cada conjunto de funcionalidades (auth, tournaments, stats, system-stats).

### Frontend (JavaScript Vanilla)

- **Arquitetura Modular**: Código JavaScript organizado em módulos (ESM).
- **Gerenciamento de Estado**: Lógica de estado contida nos respectivos módulos de UI ou componentes.
- **Comunicação com Backend**: Centralizada no `js/apiService.js`.

## Estrutura de Arquivos (Principais)

```
/
├── admin.html
├── admin-security.html
├── index.html
├── server.js                 # Ponto de entrada do servidor Express
├── package.json
├── eslint.config.mjs         # Configuração do ESLint
├── vitest.config.js          # Configuração do Vitest
├── .env.example
├── data/
│   ├── data.db               # Arquivo do banco de dados SQLite
│   └── honeypot_activity.log # Log de atividades do Honeypot
├── js/                       # JavaScript do Frontend
├── css/                      # CSS
├── lib/                      # Código do Backend (modelos, middlewares, etc.)
├── routes/                   # Definições de rotas Express
├── scripts/                  # Scripts utilitários
└── tests/                    # Testes unitários
```

## Segurança

- **Autenticação**: JWT com segredos configuráveis e expiração. Blacklist de tokens revogados.
- **Autorização**: Middleware para proteger rotas.
- **Prevenção de XSS**: Sanitização de entradas e uso de `xss-clean`.
- **Prevenção de CSRF**: Middleware `csurf` (via `lib/csrfMiddleware.js`).
- **Headers de Segurança**: `helmet` para configurar diversos headers HTTP.
- **Rate Limiting**: Para proteger contra ataques de força bruta e DoS.
- **Honeypot**: Para detecção de bots.
- **Validação de Entrada**: Em rotas e modelos.
- **Senhas**: Hashing com `bcrypt`.
- **Tratamento de Erros**: Centralizado para evitar vazamento de informações.

## Contribuição

1. Faça um fork do repositório.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
3. Faça commit de suas mudanças (`git commit -am 'Adiciona nova feature'`).
4. Envie para a branch (`git push origin feature/nova-feature`).
5. Crie um novo Pull Request.

Certifique-se de seguir o estilo de código (`npm run lint && npm run format`) e adicionar testes relevantes.

## Licença

ISC
