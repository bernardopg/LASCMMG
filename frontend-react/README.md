# LASCMMG - Frontend React com Vite

Esta é a interface de usuário (frontend) do sistema de gerenciamento de torneios LASCMMG, construída com **React**, **Vite** e **Tailwind CSS**.

## 🚀 Visão Geral

Este projeto frontend oferece uma experiência de usuário moderna, responsiva e performática para interagir com o backend do LASCMMG. Ele inclui:

- Visualização de torneios, chaveamentos e placares.
- Painel administrativo para gerenciamento completo.
- Tema claro/escuro.
- Design responsivo para desktops, tablets e mobile.

## 🛠️ Tecnologias Principais

- **React (v18+):** Biblioteca JavaScript para construir interfaces de usuário.
- **Vite:** Ferramenta de build e servidor de desenvolvimento frontend de próxima geração, oferecendo HMR (Hot Module Replacement) rápido e builds otimizados.
- **React Router DOM (v6+):** Para roteamento no lado do cliente.
- **Tailwind CSS (v3+):** Framework CSS utility-first para design rápido e customizável.
- **Axios:** Cliente HTTP para chamadas à API backend.
- **Formik & Yup:** Para gerenciamento de formulários e validação de schemas.
- **Chart.js & react-chartjs-2:** Para visualização de dados e gráficos.
- **Headless UI:** Para componentes de UI acessíveis e não estilizados (ex: Modals, Menus).
- **React Icons:** Biblioteca de ícones populares.
- **Context API (React):** Para gerenciamento de estado global (ex: Autenticação, Tema, Mensagens).
- **ESLint & Prettier:** Para linting e formatação de código.

## ⚙️ Configuração e Instalação

### Pré-requisitos

- Node.js v18 ou superior (recomendado para Vite).
- npm (v8+) ou yarn.

### Passos

1.  **Clonar o Repositório Principal (se ainda não o fez):**
    O frontend é parte do projeto LASCMMG principal. Clone o repositório raiz:

    ```bash
    git clone https://github.com/bernardopg/LASCMMG.git lascmmg
    cd lascmmg
    ```

2.  **Navegar para o Diretório do Frontend:**

    ```bash
    cd frontend-react
    ```

3.  **Instalar Dependências:**

    ```bash
    npm install
    # OU usando yarn
    # yarn install
    ```

4.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo `.env.development` (ou `.env.development.local` para configurações locais que não devem ser commitadas) na raiz de `frontend-react/`.
    As variáveis de ambiente para Vite devem começar com o prefixo `VITE_`.

    Exemplo de `frontend-react/.env.development`:

    ```ini
    # URL base da API do backend LASCMMG
    VITE_API_URL=http://localhost:3001/api

    # Versão da aplicação (opcional, pode ser lida do package.json)
    VITE_APP_VERSION=1.0.0-dev

    # Outras variáveis específicas do frontend
    # Ex: VITE_FEATURE_DARK_MODE_ENABLED=true
    ```

    Para builds de produção, crie um arquivo `.env.production` com as configurações apropriadas (ex: `VITE_API_URL=https://sua-api.com/api`).

## 🚀 Scripts Disponíveis

No diretório `frontend-react/`, você pode executar os seguintes scripts:

- **`npm run dev` (ou `yarn dev`)**
  Inicia o servidor de desenvolvimento Vite em modo de desenvolvimento.
  A aplicação estará geralmente disponível em `http://localhost:5173`.
  O HMR (Hot Module Replacement) é ativado para atualizações rápidas.

- **`npm run build` (ou `yarn build`)**
  Cria a versão de produção otimizada da aplicação na pasta `dist/`.
  Este comando utiliza Vite para empacotar e minificar os assets.

- **`npm run preview` (ou `yarn preview`)**
  Inicia um servidor local para pré-visualizar o build de produção (conteúdo da pasta `dist/`). Útil para verificar o resultado do build antes do deploy.

- **`npm run lint` (ou `yarn lint`)**
  Executa o ESLint para verificar problemas de estilo e erros no código.

- **`npm run lint:fix` (ou `yarn lint:fix`)** (se configurado no `package.json`)
  Tenta corrigir automaticamente os problemas reportados pelo ESLint.

- **`npm run format` (ou `yarn format`)** (se configurado no `package.json` para usar Prettier)
  Formata o código usando Prettier. (Nota: O script `format` na raiz do projeto geralmente cobre todo o monorepo).

## 📂 Estrutura de Pastas Principal (`frontend-react/src/`)

```
src/
├── assets/         # Imagens, fontes e outros recursos estáticos
├── components/     # Componentes React reutilizáveis
│   ├── admin/      # Componentes específicos do painel de administração
│   ├── bracket/     # Componentes para renderização de chaveamentos
│   ├── common/     # Componentes genéricos (botões, inputs, modais)
│   └── layout/     # Componentes de estrutura (Header, Footer, Sidebar)
├── context/        # Context API para gerenciamento de estado global
│   ├── AuthContext.jsx
│   ├── MessageContext.jsx
│   ├── ThemeContext.jsx
│   └── TournamentContext.jsx
├── hooks/          # Hooks customizados reutilizáveis
├── pages/          # Componentes de página (mapeados para rotas)
│   ├── admin/      # Páginas específicas do painel de administração
│   └── ...         # Outras páginas (Home, Login, Scores, Bracket, etc.)
├── router/         # Configuração do React Router
│   └── AppRouter.jsx
├── services/       # Lógica de comunicação com a API backend
│   └── api.js
├── styles/         # Arquivos CSS globais ou específicos (se não usar apenas Tailwind)
│   └── index.css   # Ponto de entrada para Tailwind e estilos globais
├── utils/          # Funções utilitárias genéricas
├── App.jsx         # Componente raiz da aplicação, configura rotas e providers
└── main.jsx        # Ponto de entrada da aplicação React, renderiza o App
```

## 🔗 Interação com o Backend

- O frontend interage com a API backend do LASCMMG (Node.js/Express) através de requisições HTTP.
- O serviço `src/services/api.js` utiliza Axios para encapsular essas chamadas.
- A URL base da API é configurada pela variável de ambiente `VITE_API_URL`.
- A autenticação é gerenciada via tokens JWT, que são armazenados (ex: em localStorage) e enviados no header `Authorization` das requisições.
- A proteção CSRF é gerenciada automaticamente pelo interceptor do Axios em `api.js`, que lê o token CSRF de um cookie e o envia no header `X-CSRF-Token`.

##🎨 Estilização

- **Tailwind CSS** é a principal ferramenta de estilização. As classes de utilidade são aplicadas diretamente no JSX.
- A configuração do Tailwind está em `tailwind.config.js`.
- Estilos globais e camadas base do Tailwind são definidos em `src/index.css`.
- O sistema suporta um tema claro e escuro, gerenciado pelo `ThemeContext` e classes do Tailwind.

## ✅ Qualidade de Código

- **ESLint:** Utilizado para manter a qualidade e consistência do código. A configuração está em `eslint.config.js` (ou `.eslintrc.cjs`).
- **Prettier:** Utilizado para formatação automática do código. A configuração global do projeto (`.prettierrc.json` na raiz) se aplica aqui.

---

Este README fornece uma visão geral do frontend React do LASCMMG. Para mais detalhes sobre o projeto como um todo, consulte o [README principal do LASCMMG](../../README.md).
