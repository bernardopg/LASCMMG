# Sistema de Gerenciamento de Torneio de Sinuca (LASCMMG)

Este é um sistema web para gerenciar torneios de sinuca, permitindo o acompanhamento de chaveamentos, registro de placares e administração de jogadores e torneios, utilizando Node.js, Express e SQLite.

## Funcionalidades Principais

- **Visualização de Chaveamento:** Exibe o chaveamento atual do torneio em formato de eliminatória simples ou dupla, mostrando jogadores, placares e data/hora agendada.
- **Histórico de Placares:** Mostra uma tabela com todos os placares registrados para o torneio selecionado, ordenável por coluna.
- **Painel Administrativo:** Área protegida para gerenciamento completo:
  - **Dashboard:** Resumo com torneios ativos, próximos jogos e estatísticas do sistema.
  - **Criação e Gerenciamento de Torneios:** Define nome, data, descrição, número de jogadores, tipo de chaveamento, e gerencia o ciclo de vida dos torneios (Pendente, Em Andamento, Concluído, Cancelado, NaLixeira).
  - **Gerenciamento de Jogadores:** Adiciona, edita, exclui e importa jogadores (via JSON) para torneios específicos.
  - **Geração de Chaveamento:** Gera automaticamente o chaveamento inicial com base nos jogadores inscritos.
  - **Agendamento de Partidas:** Define data e hora para partidas pendentes.
  - **Gerenciamento de Placares (Admin):** Adiciona, edita ou exclui placares registrados.
  - **Lixeira de Torneios:** Permite mover torneios para a lixeira, restaurá-los ou excluí-los permanentemente do banco de dados.
- **Seleção de Torneios:** Dropdown para selecionar e visualizar diferentes torneios criados.
- **Design Moderno e Responsivo:** Interface com layout adaptável.
- **Temas Visuais:**
  - **Tema Faculdade (Claro):** Baseado nas cores da logo LASCMMG (verde esmeralda e dourado) como tema padrão claro.
  - **Tema Faculdade (Escuro):** Uma versão escura do tema Faculdade, mantendo a identidade visual.
  - Alternância entre temas com persistência da preferência do usuário e respeito à preferência do sistema operacional.
- **Feedback Visual:** Indicadores de carregamento e mensagens claras de sucesso/erro.
- **Acessibilidade Aprimorada:**
  - **Navegação por Teclado:** Suporte para navegação via Tab, Enter, Espaço e teclas de seta.
  - **Imagens Acessíveis:** Garantia de textos alternativos para imagens.
  - **Atributos ARIA:** Implementação de landmarks e atributos para leitores de tela.
- **Segurança Reforçada:** Proteção contra XSS, CSRF (com tokens), headers de segurança via Helmet, rate limiting, e uso de cookies seguros.
- **Menu de Perfil:** Menu flutuante para acesso rápido à área admin ou logout.
- **Persistência com SQLite:** Armazenamento estruturado de todos os dados de torneios, jogadores, placares e configurações em um banco de dados SQLite.

## Configuração e Execução

1. **Pré-requisitos:**
    - Node.js (v14.x ou superior) e npm instalados.

2. **Instalação:**
    - Clone o repositório.
    - Navegue até o diretório raiz do projeto.
    - Execute `npm install` para instalar as dependências.
    - Copie o arquivo `.env.example` para `.env` e ajuste as configurações de ambiente (como `PORT`, `COOKIE_SECRET`, `CORS_ORIGIN`, etc.). **É crucial definir um `COOKIE_SECRET` seguro para produção.**

3. **Inicialização do Banco de Dados:**
    - Na primeira execução ou após alterações no esquema, o banco de dados SQLite (`data/lascmmg.sqlite`) será criado e/ou migrado automaticamente ao iniciar o servidor.
    - Para migrar dados de uma estrutura JSON antiga (se aplicável), a função `migrateDataFromJson` em `lib/db-init.js` pode ser executada (potencialmente através de um script npm dedicado, se necessário). Após a migração bem-sucedida, os arquivos JSON de dados de torneios não são mais necessários.

4. **Execução:**
    - **Desenvolvimento:** Execute `npm run dev` para iniciar o servidor com nodemon (reinício automático).
    - **Produção:** Execute `npm start` para iniciar o servidor em modo produção.
    - O servidor será iniciado na porta definida em `.env` (padrão `3000`).
    - Acesse `http://localhost:[PORTA]` para a interface pública e `http://localhost:[PORTA]/admin.html` para o painel administrativo.

5. **Scripts Disponíveis:**
    - `npm start`: Inicia o servidor em modo produção (usando `server.js`).
    - `npm run dev`: Inicia o servidor com nodemon para desenvolvimento (usando `server.js`).
    - `npm run lint`: Executa verificação do ESLint.
    - `npm run lint:fix`: Corrige automaticamente problemas detectados pelo ESLint.
    - `npm run format`: Formata o código usando Prettier.
    - `npm run setup-admin`: (Exemplo, pode ser o `node scripts/setup-admin-sqlite.js --verbose`) Configura o administrador no banco SQLite.
    - `npm run generate-hash -- --new <senha> --update`: Gera/atualiza hash de senha do admin.
    - `npm run verify-hash -- --verify <senha>`: Verifica uma senha de admin.

6. **Configurando Administrador:**
    - Use o script `npm run setup-admin` (ou o comando node direto) para criar o primeiro administrador.
    - **IMPORTANTE**: Use senhas fortes e altere as credenciais padrão se houver alguma.

## Testes Automatizados (API e Banco)

- O script principal de testes é `scripts/test-ciclo-completo.js`, que cobre todo o ciclo de vida do sistema via API autenticada (login, CSRF, JWT, importação, atualização, lixeira, simulação, finalização, etc).
- Para rodar todos os testes essenciais, utilize:

```sh
node scripts/run-all-tests.js
```

- Scripts de teste direto no banco (`test-direto.js`, `test-sql-direto.js`) são opcionais e servem para cenários de manipulação SQL direta.
- Scripts removidos por redundância: `test-autenticado.js`, `test-torneios.js`, `test-system.js`.
- Para adicionar novos fluxos de teste, centralize no script principal sempre que possível.

## Arquitetura do Sistema

O sistema segue uma arquitetura modular com separação clara entre frontend e backend:

### Backend (Node.js/Express)

- **API RESTful**: Endpoints para gerenciamento de torneios, jogadores, placares e autenticação.
- **Middleware de Autenticação**: Proteção de rotas administrativas.
- **Persistência de Dados**: Utiliza exclusivamente SQLite para armazenamento de dados.
- **Modelos de Dados**: Organização em modelos (`lib/models/`) para cada entidade principal.
- **Gerenciamento de Concorrência**: Transações do banco de dados para operações críticas.

### Frontend (JavaScript Vanilla)

- **Arquitetura Modular**: Código organizado em módulos ESM.
- **Gerenciamento de Estado**: Centralizado no módulo `js/state.js`.
- **Componentes Reutilizáveis**: Funções em `js/uiUtils.js` para criar elementos de UI.
- **Comunicação com Backend**: Abstraída no módulo `js/apiService.js`.

## Estrutura de Arquivos (Principais)

```text
/
├── admin.html                # Página do painel administrativo
├── index.html                # Página principal de visualização do torneio
├── server.js                 # Ponto de entrada do servidor Express (usa SQLite)
├── package.json              # Definições do projeto e dependências
├── .env.example              # Exemplo de configurações de ambiente
├── MANUAL_USUARIO.md         # Guia de uso da aplicação
├── TODO.md                   # Lista de tarefas e melhorias futuras
├── assets/                   # Recursos estáticos como imagens
├── css/                      # Folhas de estilo CSS
│   ├── style.css             # Estilos gerais da aplicação
│   ├── faculdade-theme.css   # Tema Faculdade (Claro)
│   ├── faculdade-escuro-theme.css # Tema Faculdade (Escuro)
│   ├── admin.css             # Estilos para o painel administrativo
│   └── ...                   # Outros CSS específicos de páginas/componentes
├── data/                     # Diretório para o banco de dados SQLite (lascmmg.sqlite)
├── js/                       # JavaScript do frontend
│   ├── mainApp.js            # Ponto de entrada JS para index.html
│   ├── adminApp.js           # Ponto de entrada JS para admin.html
│   ├── apiService.js         # Comunicação com API
│   ├── auth.js               # Autenticação
│   ├── state.js              # Gerenciamento de estado
│   ├── uiUtils.js            # Utilitários de UI
│   ├── admin/                # Módulos JS da área administrativa
│   ├── main/                 # Módulos JS da área pública
│   ├── ui/                   # Módulos de UI
│   │   └── theme/
│   │       └── themeSwitcher.js # Gerenciador de temas
│   └── utils/                # Utilitários JS genéricos
├── lib/                      # Código do backend
│   ├── db.js                 # Conexão com banco de dados SQLite
│   ├── schema.js             # Esquema e migrações do banco de dados
│   ├── models/               # Modelos de dados (interação com DB)
│   ├── authMiddleware.js     # Middleware de autenticação
│   └── ...                   # Outras bibliotecas e utilitários do backend
├── routes/                   # Definições de rotas da API Express
│   ├── auth.js               # Rotas de autenticação
│   ├── tournaments-sqlite.js # Rotas de torneios (usa SQLite)
│   └── ...                   # Outras rotas
├── scripts/                  # Scripts utilitários (setup de admin, etc.)
```

## Segurança e Boas Práticas

O sistema implementa diversas medidas de segurança:

- **Autenticação Segura**: Tokens JWT (ou outro método baseado em sessão segura) para proteger rotas administrativas.
- **Sanitização de Entrada**: Validação e limpeza de dados recebidos para prevenir XSS e injeção de SQL.
- **Proteção contra Ataques Comuns**:
  - CORS configurado para restringir domínios em produção.
  - Helmet para configurar headers HTTP de segurança.
  - Rate limiting para prevenir ataques de força bruta.
  - Proteção CSRF.
- **Encriptação de Senhas**: Uso de bcrypt (ou Argon2) para armazenar senhas de forma segura.
- **Tratamento de Erros**: Sistema centralizado para evitar vazamento de informações sensíveis.
- **Persistência em SQLite**: Uso de queries parametrizadas para prevenir injeção de SQL.

## Contribuição

Para contribuir com o projeto:

1. Crie um fork do repositório.
2. Crie uma branch para sua feature: `git checkout -b minha-feature`
3. Faça commit das mudanças: `git commit -m 'Adiciona nova feature'`
4. Envie para o seu fork: `git push origin minha-feature`
5. Crie um Pull Request.

Certifique-se de seguir o estilo de código existente (`npm run lint` e `npm run format`) e adicionar testes quando relevante.

## Licença

ISC
