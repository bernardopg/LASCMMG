# Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG)

## Visão Geral

O LASCMMG é um sistema web completo para organização, acompanhamento e administração de torneios de sinuca, com foco em segurança, acessibilidade, performance e facilidade de uso. Desenvolvido em Node.js/Express (backend), JavaScript Vanilla (frontend) e SQLite, é ideal para clubes, ligas e competições de qualquer porte.

## Funcionalidades Principais

- **Chaveamentos dinâmicos** (eliminação simples/dupla), geração automática e visualização interativa.
- **Painel administrativo seguro** com autenticação JWT, blacklist de tokens, logs e honeypot.
- **Gestão de jogadores**: cadastro, edição, exclusão, importação/exportação em massa (JSON).
- **Registro e edição de placares** com histórico detalhado, filtros e ordenação.
- **Agendamento de partidas** com datas e horários.
- **Lixeira inteligente** para torneios cancelados, com restauração e exclusão permanente.
- **Estatísticas avançadas**: dashboards, gráficos, histórico, desempenho de jogadores.
- **Design responsivo** e temas claro/escuro personalizáveis.
    - Alternância de tema centralizada via ThemeManager.
    - Sistema de cores dinâmico e acessível via DynamicColorSystem.
    - Painel de personalização de cores pode ser ativado via `createColorPanel()` em páginas desejadas.
    - Favicon dinâmico que se adapta ao tema do sistema.
    - Estilos de impressão otimizados para chaveamentos e tabelas.
- **Acessibilidade (A11y)**: navegação por teclado, ARIA, contraste, responsividade.
- **Segurança**: CSRF, XSS, rate limiting, cookies seguros, headers HTTP, logs, honeypot, hashing de senhas.

## Instalação e Execução Rápida

### Pré-requisitos

- Node.js 16+ e npm
- Git
- Ferramentas de build para better-sqlite3 (veja [TROUBLESHOOTING.md](TROUBLESHOOTING.md))

### Instalação

```bash
git clone <url-do-repositorio> lascmmg
cd lascmmg
npm install
cp .env.example .env
# Edite .env e defina COOKIE_SECRET e JWT_SECRET fortes
```

### Inicialização do Banco e Admin

```bash
node scripts/initialize_admin.js --username admin --password suaSenhaForte
```

### Execução

```bash
npm run dev   # Desenvolvimento (hot reload)
npm start     # Produção
```

Acesse:

- Interface pública: <http://localhost:3000>
- Painel admin: <http://localhost:3000/admin.html>

## Documentação

- [Manual do Usuário](MANUAL_USUARIO.md)
- [Padrões de Código](CODING_STANDARDS.md) _(inclui diretrizes para temas e sistema de cores)_
- [Guia de Deploy](DEPLOYMENT.md)
- [Escalabilidade](SCALING.md)
- [Resolução de Problemas](TROUBLESHOOTING.md)
- [Lista de Tarefas](TODO.md)

## Testes

- Testes unitários com [Vitest](https://vitest.dev/)
- Execute: `npm test` ou `npm run test:watch`

## Estrutura de Pastas

```text
/
├── backend/         # Backend Node.js/Express
├── frontend/        # Frontend HTML, CSS, JS
├── docs/            # Documentação
├── data/            # Banco SQLite
├── scripts/         # Scripts utilitários
├── tests/           # Testes unitários
├── .env.example     # Exemplo de variáveis de ambiente
├── package.json     # Dependências e scripts
└── README.md        # Este arquivo
```

## Segurança

- Autenticação JWT, blacklist, brute-force protection
- CSRF, XSS, cookies HttpOnly/Secure/SameSite
- Rate limiting, headers HTTP, honeypot, logs estruturados
- Senhas com bcrypt

## Contribuição

1. Faça fork e branch (`feature/nome` ou `fix/nome`)
2. Siga [CODING_STANDARDS.md](CODING_STANDARDS.md)
3. Commits: Conventional Commits
4. PRs pequenos, claros e com testes/lint passando

## Licença

MIT

---

Desenvolvido com paixão pela sinuca e por código de qualidade.
