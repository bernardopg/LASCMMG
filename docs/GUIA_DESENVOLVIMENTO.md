# 🚀 Guia de Desenvolvimento Rápido - LASCMMG

## Bem-vindo ao LASCMMG

Este guia foi criado para ajudar desenvolvedores a entenderem rapidamente como trabalhar com o sistema LASCMMG. Aqui você encontrará informações essenciais para começar a contribuir com o projeto.

## 📋 Pré-requisitos

### Tecnologias Necessárias

- **Node.js** (v18 ou superior)
- **npm** ou **yarn**
- **Git**
- **SQLite** (incluído)
- **Redis** (opcional, para cache)

### Conhecimento Recomendado

- JavaScript ES6+
- React Hooks
- Express.js
- SQLite/Redis básico
- REST APIs

## 🏃‍♂️ Começando Rapidamente

### 1. Clone e Configure

```bash
# Clone o repositório
git clone <repository-url>
cd lascmmg

# Instale todas as dependências
npm run install:all

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações
```

### 2. Estrutura Básica do Projeto

```text
lascmmg/
├── 🏠 Raiz do projeto
├── 📱 frontend-react/     # Aplicação React
├── 🔧 backend/           # Servidor Node.js/Express
├── 📚 docs/              # Documentação (onde você está!)
└── 🧪 Tests e configurações
```

### 3. Execute o Sistema

```bash
# Desenvolvimento completo (frontend + backend)
npm run dev

# Apenas backend
npm run dev:backend

# Apenas frontend
npm run dev:frontend

# Produção
npm start
```

## 🎯 Principais Conceitos

### Arquitetura

```text
Cliente React ↔ API Express ↔ Banco SQLite + Cache Redis
```

### Autenticação

- **JWT** para autenticação stateless
- **Cookies HTTP-only** para sessões
- **CSRF Protection** para formulários
- **Rate Limiting** para segurança

### Estrutura de Dados

- **Users** - Usuários do sistema
- **Players** - Atletas/lutadores
- **Tournaments** - Campeonatos/eventos
- **Matches** - Lutas/partidas
- **Scores** - Pontuações/resultados

## 🔧 Desenvolvimento Frontend

### Tecnologias Utilizadas

- **React 19** com Hooks
- **React Router** para navegação
- **Tailwind CSS** para estilos
- **Vite** como build tool
- **Axios** para requisições HTTP

### Estrutura de Pastas

```
src/
├── 📄 pages/           # Páginas da aplicação
├── 🧩 components/      # Componentes reutilizáveis
├── 🔧 hooks/          # Custom hooks
├── 🔗 context/        # Context API
├── 🔗 services/       # Chamadas para API
└── 🎨 styles/         # Estilos globais
```

### Criando uma Nova Página

```jsx
// src/pages/NovaPagina.jsx
import React from 'react';

const NovaPagina = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-100">
        Nova Página
      </h1>
      {/* Seu conteúdo aqui */}
    </div>
  );
};

export default NovaPagina;
```

### Fazendo Requisições para API

```jsx
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

// Exemplo de uso
const response = await api.get('/tournaments');
```

## 🔧 Desenvolvimento Backend

### Tecnologias Utilizadas

- **Express.js** como framework web
- **SQLite** com Better-SQLite3
- **Redis** para cache e sessões
- **JWT** para autenticação
- **Socket.IO** para tempo real

### Estrutura de Pastas

```
backend/
├── 🛣️ routes/         # Rotas da API
├── 💾 lib/models/      # Modelos de dados
├── 🔧 lib/services/    # Lógica de negócio
├── 🛡️ lib/middleware/  # Middlewares
├── 🗄️ lib/db/         # Configuração do banco
└── 📝 tests/          # Testes automatizados
```

### Criando uma Nova Rota

```javascript
// backend/routes/exemplo.js
const express = require('express');
const router = express.Router();

// GET /api/exemplo
router.get('/', (req, res) => {
  res.json({ message: 'Exemplo funcionando!' });
});

module.exports = router;
```

### Modelo de Dados

```javascript
// backend/lib/models/exemploModel.js
class ExemploModel {
  static async findAll() {
    const query = 'SELECT * FROM exemplos';
    return database.prepare(query).all();
  }

  static async create(data) {
    const query = 'INSERT INTO exemplos (nome) VALUES (?)';
    return database.prepare(query).run(data.nome);
  }
}

module.exports = ExemploModel;
```

## 🗄️ Banco de Dados

### Principais Tabelas

```sql
-- Usuários do sistema
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Jogadores/Atletas
CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  name TEXT,
  nickname TEXT,
  weight_class TEXT,
  team TEXT,
  is_active BOOLEAN DEFAULT 1
);

-- Torneios
CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  start_date DATE,
  status TEXT DEFAULT 'draft'
);
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm run test

# Testes em modo watch
npm run test:watch

# Testes com interface gráfica
npm run test:ui

# Apenas testes do backend
npm run test:backend
```

### Estrutura de Testes

```
backend/tests/
├── 🧪 unit/           # Testes unitários
└── 🔗 integration/    # Testes de integração
```

## 🚀 Deploy

### Variáveis de Ambiente (.env)

```env
# Servidor
PORT=3000
NODE_ENV=production

# Banco de dados
DATABASE_URL=./data/lascmmg.db

# JWT
JWT_SECRET=seu-secret-aqui

# CORS
CORS_ORIGIN=https://seusite.com

# Redis (opcional)
REDIS_URL=redis://localhost:6379
```

### Build para Produção

```bash
# Build do frontend
npm run build --prefix frontend-react

# Iniciar servidor
npm start
```

## 🔍 Debugging

### Frontend

```bash
# Com React DevTools
npm run dev:frontend

# Ver logs no navegador
console.log('Debug info:', dados);
```

### Backend

```javascript
// Adicione logs estruturados
const { logger } = require('./lib/logger/logger');
logger.info({ userId: 123 }, 'Usuário fez login');
```

## 📚 Recursos Úteis

### Documentação Oficial

- [React Docs](https://react.dev)
- [Express Guide](https://expressjs.com/)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [JWT.io](https://jwt.io/)

### Padrões do Projeto

- **ESLint** para qualidade de código
- **Prettier** para formatação
- **Conventional Commits** para mensagens
- **SemVer** para versionamento

## 🆘 Precisa de Ajuda?

### Problemas Comuns

1. **Erro de CORS** - Verifique configurações no backend
2. **Banco não conecta** - Verifique variáveis de ambiente
3. **Build falha** - Limpe cache: `npm run clean`
4. **Permissões** - Verifique roles no banco de dados

### Onde Pedir Ajuda

1. **Documentação** - Veja os arquivos em `/docs`
2. **Issues** - Abra uma issue no repositório
3. **Logs** - Verifique logs detalhados
4. **Comunidade** - Participe das discussões

## 🎉 Próximos Passos

1. **Explore a documentação** em `/docs`
2. **Execute o sistema** com `npm run dev`
3. **Faça sua primeira contribuição**
4. **Reporte bugs e sugestões**

---

## Bom desenvolvimento! 🚀

*Este guia foi criado para acelerar seu onboarding no projeto LASCMMG. Mantenha-o atualizado conforme o sistema evolui.*
