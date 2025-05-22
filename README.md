# LASCMMG - Sistema de Gerenciamento de Torneios de Sinuca (Versão React/Vite)

[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow.svg)](LICENSE.md)
![Build](https://img.shields.io/github/actions/workflow/status/bernardopg/LASCMMG/ci.yml?branch=main)
![Coverage](https://img.shields.io/codecov/c/github/bernardopg/LASCMMG)
![Dependabot](https://img.shields.io/badge/dependabot-enabled-brightgreen)
![Last Commit](https://img.shields.io/github/last-commit/bernardopg/LASCMMG)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)
![Vite](https://img.shields.io/badge/vite-6.3.5-blue)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-3.4.1-blue)

## 🎱 Visão Geral (Atualizado: Maio/2025)

### Manutenção (22/05/2025)
- Revisão e aprimoramento de toda a documentação do projeto
- Atualização dos schemas de API e referências de endpoints
- Otimizações de segurança no backend e API
- Padronização e melhoria do código JavaScript/React
- Consolidado scripts de administrador em `initialize_admin.js`
- Padronizado o armazenamento do banco de dados na pasta raiz `/data`
- Removidos componentes duplicados no frontend
- Implementada rota para alteração de senha de usuário

O LASCMMG é um sistema web robusto e moderno projetado para a organização, acompanhamento e administração completa de torneios de sinuca. Esta versão representa uma modernização significativa, com uma interface de usuário (frontend) totalmente reconstruída em **React com Vite e Tailwind CSS**, e um backend sólido em **Node.js/Express** utilizando **SQLite** (via `better-sqlite3`) para persistência de dados e **Redis** para caching e armazenamento de estado compartilhado.

**Diferenciais do projeto:**

- 🔒 Auditoria detalhada de ações administrativas (backend)
- 🛡️ Sistema de honeypot e bloqueio automático/manual de IPs
- 🗑️ Lixeira (soft delete) com restauração e exclusão permanente
- 📝 API RESTful documentada e alinhada com o backend real
- 🔐 Segurança avançada: JWT, CSRF, XSS, rate limit, headers, logging estruturado
- 🚀 Pronto para deploy escalável (Docker, Nginx, PM2, CI/CD)
- 📚 Documentação e padrões de indústria em todos os arquivos markdown

O sistema foi desenvolvido com foco em:

- **Experiência do Usuário (UX) Moderna:** Interface intuitiva, responsiva e agradável
- **Performance:** Carregamento rápido e interações fluidas
- **Segurança:** Proteções contra ameaças web comuns, validação de entrada robusta
- **Acessibilidade (A11y):** Esforços para tornar o sistema utilizável por todos
- **Manutenibilidade:** Código bem estruturado e documentado

Ideal para clubes de sinuca, ligas amadoras e profissionais, e qualquer entusiasta que deseje organizar competições de forma eficiente.

## ✨ Funcionalidades Principais

- **Frontend Moderno em React:**
  - Interface de usuário dinâmica e componentizada
  - Roteamento com React Router DOM v6 e code-splitting com `React.lazy`
  - Gerenciamento de estado global com Context API
- **Estilização com Tailwind CSS:**
  - Design responsivo e altamente customizável
  - Suporte a tema claro/escuro com persistência da preferência do usuário
  - Animações sutis para feedback visual
- **Chaveamentos Dinâmicos e Interativos:**
  - Geração e visualização de chaveamentos de eliminação simples e dupla
  - Atualização em tempo real do progresso das partidas
- **Painel Administrativo Completo e Seguro:**
  - Autenticação baseada em JWT
  - Gerenciamento de torneios, jogadores e placares
  - Lixeira para recuperação de itens excluídos (soft delete)
  - Funcionalidades de segurança, incluindo monitoramento de honeypot e gerenciamento de IPs bloqueados
- **Gestão Detalhada de Torneios:**
  - Criação, edição e exclusão de torneios
  - Gerenciamento de jogadores por torneio
  - Configuração flexível de regras e formatos
  - Importação/exportação de dados em diferentes formatos
  - Histórico completo de resultados e estatísticas

## 🚀 Requisitos & Início Rápido

### Pré-requisitos

- **Node.js:** v18.x ou superior
- **npm ou yarn:** Gerenciador de pacotes do Node.js
- **Redis** (recomendado para produção)
- **Ferramentas de build C/C++** para dependências nativas (como `better-sqlite3`)

### Como executar o projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/bernardopg/LASCMMG.git
   cd LASCMMG
   ```

2. **Configure o backend:**
   ```bash
   # Instale as dependências do backend
   npm install

   # Configure as variáveis de ambiente
   cp .env.example .env
   # Edite o arquivo .env conforme necessário

   # Inicie o servidor de desenvolvimento
   npm run dev
   ```

3. **Configure o frontend:**
   ```bash
   # Navegue até a pasta do frontend
   cd frontend-react

   # Instale as dependências do frontend
   npm install

   # Configure as variáveis de ambiente do frontend
   cp .env.example .env.local
   # Edite o arquivo .env.local conforme necessário

   # Inicie o servidor de desenvolvimento do frontend
   npm start
   ```

4. **Acesse o sistema:**
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:5173

## 📚 Documentação Completa

Nossa documentação abrangente está disponível na pasta `/docs`:

- [**API_REFERENCE.md**](/docs/API_REFERENCE.md) - Documentação completa da API REST
- [**MANUAL_USUARIO.md**](/docs/MANUAL_USUARIO.md) - Guia do usuário final
- [**DEPLOYMENT.md**](/docs/DEPLOYMENT.md) - Instruções detalhadas para implantação
- [**CODING_STANDARDS.md**](/docs/CODING_STANDARDS.md) - Padrões de codificação do projeto
- [**SCALING.md**](/docs/SCALING.md) - Estratégias para escalabilidade
- [**TROUBLESHOOTING.md**](/docs/TROUBLESHOOTING.md) - Soluções para problemas comuns
- [**RELATORIO_CONSOLIDADO_LASCMMG.md**](/docs/RELATORIO_CONSOLIDADO_LASCMMG.md) - Relatório técnico abrangente
- [**TODO.md**](/docs/TODO.md) - Lista de tarefas pendentes e melhorias planejadas

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia nosso [guia de contribuição](CONTRIBUTING.md) antes de enviar pull requests.

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.

## 🔒 Segurança

Consulte nosso [SECURITY.md](SECURITY.md) para informações sobre como reportar vulnerabilidades de segurança.

## 👥 Autores & Reconhecimentos

- **Desenvolvido por:** Equipe LASCMMG
- **Agradecimentos especiais:** A todos os colaboradores e à comunidade de sinuca da CMMG
- **Última revisão:** 22 de maio de 2025
