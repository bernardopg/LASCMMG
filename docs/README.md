# Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG) - Versão React

## Visão Geral

O LASCMMG é um sistema web completo para organização, acompanhamento e administração de torneios de sinuca. Esta versão modernizada utiliza **React com Tailwind CSS** para o frontend, mantendo o backend robusto em **Node.js/Express** e **SQLite** (via `better-sqlite3`). O sistema foca em segurança, acessibilidade, performance, uma experiência de usuário moderna e facilidade de uso, sendo ideal para clubes, ligas e competições de qualquer porte.

## Funcionalidades Principais

- **Frontend Moderno em React:** Interface de usuário totalmente reconstruída com React para componentização, reatividade e manutenibilidade aprimoradas.
- **Estilização com Tailwind CSS:** Design responsivo e customizável utilizando a utility-first framework Tailwind CSS.
- **Chaveamentos Dinâmicos:** Geração e visualização interativa de chaveamentos (eliminação simples/dupla).
- **Painel Administrativo Seguro:** Autenticação JWT, funcionalidades de segurança como blacklist de tokens, logs detalhados e monitoramento de honeypot.
- **Gestão Completa de Torneios:** Criação, edição, listagem e arquivamento de torneios.
- **Gerenciamento de Jogadores:** Cadastro, edição, exclusão e, futuramente, importação/exportação.
- **Registro de Placares:** Adição e edição de placares com histórico detalhado, filtros e ordenação.
- **Agendamento de Partidas:** Definição de datas e horários para as partidas (funcionalidade base).
- **Lixeira Inteligente:** Gerenciamento de torneios e itens cancelados/excluídos com opção de restauração ou exclusão permanente.
- **Estatísticas Avançadas:** Dashboards visuais, gráficos de desempenho e histórico de confrontos.
- **Design Responsivo e Acessível (A11y):**
    - Interface adaptável a todos os dispositivos (desktop, tablet, mobile).
    *   Sidebar inteligente colapsável e menu mobile otimizado.
    *   Suporte a tema claro/escuro com persistência de preferência do usuário.
    *   Componentes interativos com feedback visual claro e animações suaves.
    *   Foco em navegação por teclado, atributos ARIA e contraste de cores.
- **Segurança:** Proteções contra CSRF, XSS; uso de cookies HttpOnly/Secure/SameSite; rate limiting; headers HTTP de segurança; hashing de senhas (bcrypt).

## Tecnologias Utilizadas

**Frontend:**
- React (v18+)
- React Router DOM (v6+)
- Tailwind CSS (v3+)
- Axios (para chamadas API)
- Formik & Yup (para formulários e validação)
- Chart.js & react-chartjs-2 (para gráficos)
- Headless UI (para componentes de UI acessíveis)
- React Icons

**Backend:**
- Node.js (v16+)
- Express.js
- SQLite (via `better-sqlite3`)
- JWT (JSON Web Tokens) para autenticação
- bcrypt (para hashing de senhas)
- Pino (para logging)

**Ferramentas de Desenvolvimento:**
- React Scripts (Create React App) para o build do frontend
- ESLint & Prettier para linting e formatação
- Vitest (para testes no backend) / Jest (via CRA para frontend)

## Instalação e Execução

### Pré-requisitos

- Node.js v16 ou superior
- npm (geralmente incluído com Node.js)
- Git
- Ferramentas de compilação C/C++ (para `better-sqlite3`):
    - Linux: `build-essential`, `python3`, `make`, `g++`
    - macOS: Xcode Command Line Tools
    - Windows: Visual Studio com "Desktop development with C++" ou `windows-build-tools` (via npm)

### Configuração do Projeto

1.  **Clonar o Repositório:**
    ```bash
    git clone https://github.com/bernardopg/LASCMMG.git lascmmg
    cd lascmmg
    ```

2.  **Configurar Backend:**
    *   Copie o arquivo de configuração de exemplo:
        ```bash
        cp .env.example .env
        ```
    *   Edite o arquivo `.env` na raiz do projeto. **É crucial definir `COOKIE_SECRET` e `JWT_SECRET` com valores longos, aleatórios e seguros.**
        ```ini
        # Exemplo de .env para backend
        PORT=3001 # Porta para o backend API
        NODE_ENV=development
        COOKIE_SECRET=seu_segredo_super_forte_para_cookies
        JWT_SECRET=seu_outro_segredo_incrivel_para_jwt
        # ... outras configurações ...
        ```
    *   Instale as dependências do backend (e do projeto geral):
        ```bash
        npm install
        ```

3.  **Configurar Frontend (React):**
    *   Navegue até o diretório do frontend:
        ```bash
        cd frontend-react
        ```
    *   Crie um arquivo `.env.development` (ou `.env.local` para configurações locais que não devem ser commitadas) para variáveis de ambiente específicas do frontend. Exemplo:
        ```ini
        # frontend-react/.env.development
        REACT_APP_API_URL=http://localhost:3001 # URL do seu backend
        GENERATE_SOURCEMAP=false # Opcional, para builds de desenvolvimento mais rápidos
        ```
    *   Instale as dependências do frontend:
        ```bash
        npm install
        ```
    *   Volte para o diretório raiz do projeto:
        ```bash
        cd ..
        ```

4.  **Inicialização do Banco de Dados e Administrador:**
    *   O banco de dados SQLite (`data/database.sqlite`) é criado automaticamente ao iniciar o backend.
    *   Crie o primeiro usuário administrador (execute na raiz do projeto):
        ```bash
        node scripts/initialize_admin.js --username admin --password suaSenhaSuperForte
        ```

### Execução

Você precisará de dois terminais: um para o backend e um para o frontend.

1.  **Iniciar Backend API (na raiz do projeto `/lascmmg`):**
    ```bash
    npm run dev:backend  # Para desenvolvimento com Nodemon (se configurado)
    # OU
    npm start            # Para iniciar o servidor de produção do backend
    ```
    O backend estará rodando em `http://localhost:3001` (ou a porta definida em `.env`).

2.  **Iniciar Frontend React (no diretório `/lascmmg/frontend-react`):**
    ```bash
    npm start
    ```
    A aplicação React estará acessível em `http://localhost:3000` (ou outra porta se a 3000 estiver ocupada).

**Acesse:**
- Interface pública e Painel Admin: `http://localhost:3000` (o roteamento do React cuidará das subpáginas como `/admin`)

## Documentação Detalhada

- **[Manual do Usuário](MANUAL_USUARIO.md):** Como usar as funcionalidades do sistema.
- **[Padrões de Código](CODING_STANDARDS.md):** Diretrizes para desenvolvimento e contribuição.
- **[Guia de Deploy](DEPLOYMENT.md):** Instruções para implantação em produção.
- **[Estratégia de Escalabilidade](SCALING.md):** Como o sistema pode crescer.
- **[Resolução de Problemas](TROUBLESHOOTING.md):** Soluções para questões comuns.
- **[Lista de Tarefas (TODO)](TODO.md):** Funcionalidades futuras e melhorias.

## Testes

- **Backend:** Testes unitários com [Vitest](https://vitest.dev/).
  ```bash
  # Na raiz do projeto
  npm test
  npm run test:watch
  ```
- **Frontend:** Testes com Jest (configurado por Create React App).
  ```bash
  # No diretório frontend-react/
  npm test
  ```

## Estrutura de Pastas Principal

```text
/lascmmg
├── backend/                # Lógica do servidor Node.js/Express
│   ├── lib/                # Módulos principais (DB, auth, utils)
│   ├── models/             # Interação com o banco de dados
│   ├── routes/             # Definições de rotas da API
│   └── server.js           # Ponto de entrada do backend
├── frontend-react/         # Aplicação Frontend React
│   ├── public/             # Assets estáticos e index.html principal
│   ├── src/                # Código fonte do React
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/       # Chamadas API
│   │   ├── styles/         # CSS global, se necessário
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── tailwind.config.js
│   └── package.json        # Dependências do frontend
├── docs/                   # Documentação do projeto
├── data/                   # Arquivo do banco de dados SQLite (gerado)
├── scripts/                # Scripts utilitários (ex: init admin, backup)
├── .env.example            # Exemplo de variáveis de ambiente para o backend
├── .gitignore
├── package.json            # Dependências do backend e scripts gerais
└── README.md               # Este arquivo
```

## Segurança

- Autenticação baseada em JWT com refresh tokens (se implementado) e blacklist de tokens.
- Proteção contra CSRF (ex: via SameSite cookies, tokens anti-CSRF se necessário).
- Prevenção de XSS (sanitização de inputs, uso correto de frameworks frontend).
- Cookies configurados com HttpOnly, Secure (em produção), SameSite.
- Rate limiting para APIs críticas.
- Headers HTTP de segurança (Helmet ou configuração manual).
- Logging estruturado de eventos de segurança e erros.
- Hashing de senhas com bcrypt.

## Contribuição

1.  Faça um fork do repositório.
2.  Crie uma branch para sua feature ou correção (ex: `feature/nova-funcionalidade` ou `fix/corrige-bug-xyz`).
3.  Siga os padrões definidos em [CODING_STANDARDS.md](CODING_STANDARDS.md).
4.  Escreva mensagens de commit claras e siga o padrão [Conventional Commits](https://www.conventionalcommits.org/).
5.  Garanta que todos os testes e verificações de lint/formatação passem.
6.  Abra um Pull Request detalhado para a branch principal.

## Licença

MIT

---

Desenvolvido com paixão pela sinuca e por código de qualidade.
