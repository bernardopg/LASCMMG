# 📚 Documentação do Sistema LASCMMG

## Visão Geral

Esta pasta contém toda a documentação técnica e funcional do sistema LASCMMG (Liga Acadêmica de Sports Combat MMA e Grappling). Aqui você encontrará informações detalhadas sobre a arquitetura, funcionalidades, sitemap e implementação do sistema.

## 📋 Documentos Disponíveis

### 🗺️ Sitemap e Arquitetura

- **[SITE_MAP.md](SITE_MAP.md)** - Documentação completa da arquitetura do sistema
- **[SITEMAP_VISUAL.md](SITEMAP_VISUAL.md)** - Representação visual da estrutura do sistema

### ⚙️ Funcionalidades

- **[FUNCIONALIDADES_COMPLETAS.md](FUNCIONALIDADES_COMPLETAS.md)** - Lista detalhada de todas as funcionalidades categorizadas por prioridade

### 📊 Outros Documentos

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumo da implementação atual
- **[FRONTEND_IMPROVEMENTS_PLAN.md](FRONTEND_IMPROVEMENTS_PLAN.md)** - Plano de melhorias do frontend
- **[DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md)** - Documentação das migrações do banco
- **[TESTING.md](TESTING.md)** - Estratégia e resultados de testes

## 🎯 Como Usar Esta Documentação

### Para Desenvolvedores Iniciantes

1. **Comece pelo Sitemap Visual** - [SITEMAP_VISUAL.md](SITEMAP_VISUAL.md)
   - Entenda a estrutura geral do sistema
   - Veja como os componentes se conectam

2. **Explore as Funcionalidades** - [FUNCIONALIDADES_COMPLETAS.md](FUNCIONALIDADES_COMPLETAS.md)
   - Conheça todas as features implementadas
   - Entenda as prioridades e status

3. **Detalhes Técnicos** - [SITE_MAP.md](SITE_MAP.md)
   - Documentação técnica completa
   - Endpoints, modelos e configurações

### Para Administradores

1. **Funcionalidades Administrativas** - Busque por "Administração" em [FUNCIONALIDADES_COMPLETAS.md](FUNCIONALIDADES_COMPLETAS.md)
2. **Configurações de Segurança** - Veja seção de segurança em [SITE_MAP.md](SITE_MAP.md)
3. **Backup e Monitoramento** - Consulte seções relevantes em ambos os documentos

### Para Usuários Finais

1. **Funcionalidades por Persona** - Veja a seção específica em [FUNCIONALIDADES_COMPLETAS.md](FUNCIONALIDADES_COMPLETAS.md)
2. **Fluxo de Navegação** - Use o sitemap visual para entender como navegar

## 🔍 Navegação Rápida

### Encontre Informações Específicas

| O que você precisa? | Onde encontrar |
|-------------------|----------------|
| Lista de páginas | [SITEMAP_VISUAL.md](SITEMAP_VISUAL.md) - Seção Frontend |
| APIs disponíveis | [SITE_MAP.md](SITE_MAP.md) - Seção Endpoints |
| Funcionalidades por prioridade | [FUNCIONALIDADES_COMPLETAS.md](FUNCIONALIDADES_COMPLETAS.md) - Início |
| Configuração do ambiente | [SITE_MAP.md](SITE_MAP.md) - Seção Configuração |
| Tecnologias utilizadas | [SITE_MAP.md](SITE_MAP.md) - Seção Tecnologias |
| Roadmap do projeto | [FUNCIONALIDADES_COMPLETAS.md](FUNCIONALIDADES_COMPLETAS.md) - Seção Roadmap |

## 📈 Estrutura do Sistema

```
LASCMMG/
├── 🏠 Frontend (React)
│   ├── 📱 Páginas Públicas (3)
│   ├── 👤 Páginas do Usuário (10)
│   ├── ⚙️ Páginas Admin (18)
│   └── 🧩 Componentes (8 categorias)
│
├── 🔧 Backend (Node.js/Express)
│   ├── 🚀 Rotas da API (9)
│   ├── 💾 Modelos de Dados (6)
│   ├── 🔧 Serviços (3)
│   └── 🛡️ Middleware (6)
│
├── 🗄️ Banco de Dados
│   ├── 💾 SQLite (persistente)
│   ├── ⚡ Redis (cache)
│   └── 📋 Estrutura relacional
│
└── 🌐 Integrações Externas
    ├── 📚 Swagger/OpenAPI
    ├── 🔗 Socket.IO (tempo real)
    └── 🔒 Camada de segurança
```

## 🚀 Iniciando com o Sistema

### Para Desenvolvimento

```bash
# Clone o repositório
git clone <repository-url>
cd lascmmg

# Instalar dependências
npm run install:all

# Iniciar desenvolvimento
npm run dev
```

### Para Produção

```bash
# Build do frontend
npm run build --prefix frontend-react

# Iniciar servidor
npm start
```

## 📞 Suporte e Contribuição

### Reportar Problemas

- Abra uma issue no repositório
- Descreva detalhadamente o problema
- Inclua passos para reproduzir

### Sugerir Melhorias

- Consulte o roadmap em [FUNCIONALIDADES_COMPLETAS.md](FUNCIONALIDADES_COMPLETAS.md)
- Abra uma issue com a sugestão
- Categorize por prioridade e dificuldade

### Contribuir com Código

1. Faça fork do repositório
2. Crie uma branch para sua feature
3. Implemente seguindo os padrões existentes
4. Adicione testes se necessário
5. Submeta um Pull Request

## 🔄 Manutenção da Documentação

Esta documentação é mantida atualizada e deve ser consultada sempre que:

- Novas funcionalidades forem implementadas
- Mudanças na arquitetura forem feitas
- Melhorias de segurança forem aplicadas
- Modificações nos processos de negócio ocorrerem

**Última atualização:** Dezembro 2025
**Versão do sistema:** 1.2.0
**Status:** ✅ Ativo e em desenvolvimento

---

*Esta documentação é parte integrante do sistema LASCMMG e deve ser utilizada como referência oficial para desenvolvimento, manutenção e utilização do sistema.*
