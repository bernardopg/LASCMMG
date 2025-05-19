# LASCMMG - Sistema de Gerenciamento de Torneios de Sinuca (Versão React)

[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow.svg)](LICENSE.md)
![Build](https://img.shields.io/github/actions/workflow/status/bernardopg/LASCMMG/ci.yml?branch=main)
![Coverage](https://img.shields.io/codecov/c/github/bernardopg/LASCMMG)
![Dependabot](https://img.shields.io/badge/dependabot-enabled-brightgreen)
![Last Commit](https://img.shields.io/github/last-commit/bernardopg/LASCMMG)

## 🎱 Visão Geral

O LASCMMG é um sistema web robusto e moderno projetado para a organização, acompanhamento e administração completa de torneios de sinuca. Esta versão representa uma modernização significativa, com uma interface de usuário (frontend) totalmente reconstruída em **React com Tailwind CSS**, e um backend sólido em **Node.js/Express** utilizando **SQLite** (via `better-sqlite3`) para persistência de dados e **Redis** para caching e armazenamento de estado compartilhado.

**Diferenciais do projeto:**
- Auditoria detalhada de ações administrativas (backend).
- Sistema de honeypot e bloqueio automático/manual de IPs.
- Lixeira (soft delete) com restauração e exclusão permanente.
- API RESTful documentada e alinhada com o backend real.
- Segurança avançada: JWT, CSRF, XSS, rate limit, headers, logging estruturado.
- Pronto para deploy escalável (Docker, Nginx, PM2, CI/CD).
- Documentação e padrões de indústria em todos os arquivos markdown.

O sistema foi desenvolvido com foco em:

- **Experiência do Usuário (UX) Moderna:** Interface intuitiva, responsiva e agradável.
- **Performance:** Carregamento rápido e interações fluidas.
- **Segurança:** Proteções contra ameaças web comuns, validação de entrada robusta.
- **Acessibilidade (A11y):** Esforços para tornar o sistema utilizável por todos.
- **Manutenibilidade:** Código bem estruturado e documentado.

Ideal para clubes de sinuca, ligas amadoras e profissionais, e qualquer entusiasta que deseje organizar competições de forma eficiente.

## ✨ Funcionalidades Principais

- **Frontend Moderno em React:**
  - Interface de usuário dinâmica e componentizada.
  - Roteamento com React Router DOM e code-splitting com `React.lazy`.
  - Gerenciamento de estado global com Context API.
- **Estilização com Tailwind CSS:**
  - Design responsivo e altamente customizável.
  - Suporte a tema claro/escuro com persistência da preferência do usuário.
  - Animações sutis para feedback visual.
- **Chaveamentos Dinâmicos e Interativos:**
  - Geração e visualização de chaveamentos de eliminação simples e dupla.
  - Atualização em tempo real do progresso das partidas.
- **Painel Administrativo Completo e Seguro:**
  - Autenticação baseada em JWT.
  - Gerenciamento de torneios (incluindo formulário de criação e página de listagem), jogadores e placares.
  - Lixeira para recuperação de itens excluídos (soft delete).
  - Funcionalidades de segurança, incluindo monitoramento de honeypot, gerenciamento de IPs bloqueados, e armazenamento de tokens CSRF e rate-limiting em Redis.
- **Gestão Detalhada de Torneios:**
  - Criação, edição, listagem e arquivamento.
  - Definição de status, datas, número de jogadores, tipo de chaveamento, taxas e premiações.
- **Gerenciamento de Jogadores:**
  - Cadastro, edição e exclusão (soft delete e permanente).
  - Importação de listas de jogadores com validação.
- **Registro de Placares:**
  - Adição e edição de resultados das partidas.
  - Histórico detalhado com filtros e ordenação.
- **Estatísticas Abrangentes:**
  - Dashboards visuais com informações sobre torneios e jogadores.
  - Desempenho individual de jogadores, confrontos diretos (H2H) e mais.
- **Design Responsivo e Acessível (A11y):**
  - Interface adaptável a desktops, tablets e dispositivos móveis.
  - Sidebar inteligente (colapsável/expansível) e menu mobile otimizado.
  - Foco em navegação por teclado, atributos ARIA e contraste de cores adequado.
- **Segurança Robusta no Backend:**
  - Validação de entrada com Joi.
  - Proteções contra CSRF (com tokens em Redis) e XSS.
  - Uso de cookies HttpOnly, Secure e SameSite.
  - Rate limiting para APIs críticas (com suporte a Redis).
  - Headers HTTP de segurança (configurados via Helmet).
  - Hashing de senhas com bcrypt.
  - Logging detalhado de eventos de segurança e erros (Pino).
  - Trilha de auditoria para ações administrativas.

## 🛠️ Tecnologias Utilizadas

### Frontend

- **React (v18+):** Biblioteca JavaScript para construção de interfaces de usuário.
- **React Router DOM (v6+):** Para roteamento no lado do cliente.
- **Tailwind CSS (v3+):** Framework CSS utility-first para design rápido e customizável.
- **Axios:** Cliente HTTP para chamadas à API.
- **Formik & Yup:** Para gerenciamento de formulários e validação de schemas.
- **Chart.js & react-chartjs-2:** Para visualização de dados e gráficos.
- **Headless UI:** Para componentes de UI acessíveis e não estilizados (ex: Modals, Menus).
- **React Icons:** Biblioteca de ícones.
- **Vite:** Ferramenta de build e servidor de desenvolvimento frontend.

### Backend

- **Node.js (v18+ recomendado):** Ambiente de execução JavaScript no servidor.
- **Express.js:** Framework web minimalista para Node.js.
- **SQLite (via `better-sqlite3`):** Banco de dados relacional embarcado.
- **Redis:** Cache e armazenamento de estado compartilhado (CSRF, rate limit, JWT blacklist, honeypot tracker).
- **Joi:** Validação de schemas de requisição.
- **JSON Web Tokens (JWT):** Para autenticação stateless.
- **bcrypt:** Para hashing seguro de senhas.
- **Pino:** Logger JSON de alta performance.
- **Helmet:** Para configuração de headers HTTP de segurança.
- **express-rate-limit:** Para limitar requisições à API.
- **Middleware customizado com Redis:** Para proteção contra CSRF.
- **xss-clean:** Para sanitização contra XSS.

### Ferramentas de Desenvolvimento e Qualidade

- **ESLint:** Para análise estática de código e identificação de problemas.
- **Prettier:** Para formatação automática de código, garantindo consistência.
- **Vitest:** Framework de testes para o backend (unitários, integração).
- **Jest & React Testing Library (ou Vitest para frontend):** Para testes de componentes e funcionalidades no frontend.
- **rollup-plugin-visualizer:** Para análise do bundle do frontend Vite.
- **Husky & lint-staged (Recomendado):** Para executar linters e formatadores antes dos commits.

## 🚀 Instalação e Execução

Consulte o [**Guia de Deploy (DEPLOYMENT.md)**](DEPLOYMENT.md) para instruções detalhadas sobre configuração, build e implantação em ambientes de desenvolvimento e produção.

Resumidamente:

1.  **Pré-requisitos:** Node.js (v18+), npm/yarn, Git, ferramentas de compilação C/C++, Servidor Redis (para funcionalidade completa).
2.  **Clonar Repositório:** `git clone https://github.com/bernardopg/LASCMMG.git lascmmg && cd lascmmg`
3.  **Configurar Backend:**
    - Copie `.env.example` para `.env` e configure as variáveis (especialmente `COOKIE_SECRET`, `JWT_SECRET`, `REDIS_URL`).
    - Instale dependências: `npm install` (inclui `joi`, `redis`).
4.  **Configurar Frontend:**
    - Navegue para `frontend-react/`.
    - Crie `.env.development` (ou `.env.production`) e defina `VITE_API_URL`.
    - Instale dependências: `npm install` (inclui `rollup-plugin-visualizer` como devDependency).
    - Volte para a raiz: `cd ..`
5.  **Inicializar Admin:** `node scripts/initialize_admin.js --username admin --password suaSenhaSuperForte` (na raiz)
6.  **Executar:**
    - Backend (raiz): `npm run dev` (ou `npm start` para produção)
    - Frontend (`frontend-react/`): `npm run dev` (Vite usa `npm run dev` por padrão)
7.  **Gerenciamento do Banco de Dados (Opcional):**
    - `node scripts/manage-database.js backup` - Para criar um backup do banco de dados.
    - `node scripts/manage-database.js vacuum` - Para otimizar o arquivo do banco de dados.

## 📚 Documentação Detalhada

Explore a pasta `docs/` para guias completos:

- **[📄 MANUAL_USUARIO.md](MANUAL_USUARIO.md):** Guia completo sobre como utilizar todas as funcionalidades do sistema.
- **[📜 CODING_STANDARDS.md](CODING_STANDARDS.md):** Padrões de codificação e boas práticas para desenvolvimento e contribuição.
- **[🚀 DEPLOYMENT.md](DEPLOYMENT.md):** Instruções detalhadas para implantação em ambientes de desenvolvimento e produção.
- **[📈 SCALING.md](SCALING.md):** Estratégias e considerações para a escalabilidade do sistema.
- **[🔧 TROUBLESHOOTING.md](TROUBLESHOOTING.md):** Soluções para problemas comuns de instalação, configuração e execução.
- **[📝 TODO.md](TODO.md):** Lista de tarefas, funcionalidades planejadas e melhorias futuras.
- **[🎱 RELATORIO_CONSOLIDADO_LASCMMG.md](RELATORIO_CONSOLIDADO_LASCMMG.md):** Análise completa do sistema com recomendações.
- **[📖 API_REFERENCE.md](API_REFERENCE.md):** Referência inicial da API.

## 🧪 Testes

- **Backend (Vitest):** `npm test` ou `npm run test:watch` (na raiz do projeto).
- **Frontend (Vitest ou Jest & React Testing Library):** `npm test` (no diretório `frontend-react/`). (Verificar `CODING_STANDARDS.md` para a escolha final do framework de teste do frontend).

## 📂 Estrutura de Pastas Principal

```
/lascmmg
├── backend/
│   ├── lib/
│   │   ├── config/
│   │   ├── db/         # Contém redisClient.js, database.js, db-init.js, schema.js
│   │   ├── logger/
│   │   ├── middleware/ # Contém authMiddleware.js, csrfMiddleware.js, honeypot.js
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/      # Contém validationUtils.js
│   ├── routes/         # Contém admin.js, auth.js, player.js, scores.js, security.js, tournaments.js
│   └── server.js
├── docs/               # Contém API_REFERENCE.md
├── frontend-react/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── admin/  # Contém TournamentForm.jsx
│   │   │   └── ...
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── admin/  # Contém CreateTournamentPage.jsx, AdminTournamentListPage.jsx
│   │   │   └── ...
│   │   ├── services/   # api.js
│   │   ├── App.jsx     # Contém a lógica de roteamento principal
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js  # Configurado com rollup-plugin-visualizer
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── data/
├── scripts/            # Contém initialize_admin.js, manage-database.js
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── package.json
├── LICENSE.md
└── README.md
```

## 🛡️ Segurança

O sistema implementa diversas medidas de segurança, incluindo:

- Autenticação robusta com JWT.
- Proteção contra CSRF (tokens armazenados em Redis) e XSS.
- Configuração segura de cookies (HttpOnly, Secure, SameSite).
- Rate limiting para APIs críticas (com suporte a Redis para contadores).
- Validação de entrada de API com Joi.
- Uso de Helmet para headers HTTP de segurança.
- Logging detalhado de eventos e erros.
- Hashing de senhas com bcrypt.
- Trilha de auditoria para ações administrativas.
- Sistema Honeypot para detecção de bots.

Consulte `CODING_STANDARDS.md` e as configurações de segurança no backend para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1.  Faça um fork do repositório.
2.  Crie uma branch para sua feature/correção (ex: `feature/minha-nova-feature` ou `fix/corrige-bug-xyz`).
3.  Siga os padrões definidos em [CODING_STANDARDS.md](CODING_STANDARDS.md).
4.  Escreva mensagens de commit claras e significativas, seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/).
5.  Garanta que todos os testes e verificações de lint/formatação passem.
6.  Abra um Pull Request (PR) detalhado para a branch `main` (ou a branch de desenvolvimento principal).

## 📜 Licença

Este projeto é licenciado sob a [Licença MIT](LICENSE.md).

---

Desenvolvido com paixão pela sinuca e por código de qualidade. Esperamos que o LASCMMG seja uma ferramenta valiosa para sua comunidade!
