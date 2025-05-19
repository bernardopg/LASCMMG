# LASCMMG React

Versão em React do sistema de gerenciamento de torneios da Liga Amadora Sul-Campista de Mari-Mari-Gomes.

## Requisitos

- Node.js 16+
- npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install

# OU usando yarn
yarn install
```

## Executando o projeto

```bash
# Iniciar em modo de desenvolvimento
npm start

# OU usando yarn
yarn start
```

O aplicativo estará disponível em [http://localhost:3000](http://localhost:3000).

## Estrutura de arquivos

```
frontend-react/
├── public/             # Arquivos públicos
│   ├── assets/         # Imagens e recursos estáticos
│   ├── index.html      # Template HTML
│   └── manifest.json   # Manifesto PWA
│
├── src/                # Código fonte
│   ├── components/     # Componentes reutilizáveis
│   │   ├── common/     # Componentes comuns
│   │   ├── layout/     # Componentes de layout
│   │   ├── forms/      # Componentes de formulários
│   │   └── ui/         # Componentes de interface
│   │
│   ├── context/        # Contextos da aplicação
│   │   ├── AuthContext.jsx        # Contexto de autenticação
│   │   ├── MessageContext.jsx     # Contexto de mensagens
│   │   └── TournamentContext.jsx  # Contexto de torneios
│   │
│   ├── hooks/          # Custom hooks
│   │
│   ├── pages/          # Páginas da aplicação
│   │   ├── Login.jsx   # Página de login
│   │   └── ...         # Outras páginas
│   │
│   ├── services/       # Serviços e APIs
│   │
│   ├── utils/          # Utilidades e helpers
│   │
│   ├── App.jsx         # Componente principal
│   ├── index.jsx       # Ponto de entrada
│   └── index.css       # Estilos globais e Tailwind
│
├── tailwind.config.js  # Configuração do Tailwind CSS
├── postcss.config.js   # Configuração do PostCSS
└── package.json        # Dependências e scripts
```

## Scripts disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm build` - Cria a versão de produção
- `npm test` - Executa os testes
- `npm eject` - Ejeta a configuração do Create React App

## Tecnologias utilizadas

- [React](https://reactjs.org/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/)
- [Formik](https://formik.org/) & [Yup](https://github.com/jquense/yup)
- [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)

## Backend API

O frontend React interage com a API backend através de endpoints REST. Por padrão, as requisições são feitas para o mesmo host onde o frontend está sendo servido, mas isso pode ser configurado através de variáveis de ambiente.

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto para configurar as variáveis de ambiente:

```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_VERSION=$npm_package_version
