# Manual do Usuário - Sistema LASCMMG (Versão React com Vite)

[⬅ Voltar ao README Principal](../README.md)

## Índice

- [Introdução](#🎯-domine-o-lascmmg-seu-guia-completo-para-gerenciar-torneios-de-sinuca)
- [Acessando o Sistema](#🔑-acessando-o-sistema)
- [Visão Geral da Interface](#🖥️-visão-geral-da-interface-moderna)
  - [Cabeçalho Principal](#cabeçalho-principal)
  - [Barra Lateral de Navegação](#barra-lateral-de-navegação)
  - [Área de Conteúdo Principal](#área-de-conteúdo-principal)
- [Funcionalidades Públicas](#1-explorando-as-funcionalidades-públicas)
  - [Selecionando um Torneio](#selecionando-um-torneio)
  - [Dashboard (Página Inicial)](#dashboard-página-inicial)
  - [Chaveamento (Brackets)](#chaveamento-brackets)
  - [Histórico de Placares](#histórico-de-placares)
  - [Estatísticas](#estatísticas)
- [Painel Administrativo](#2-gerenciando-torneios-o-painel-administrativo)
  - [Acesso e Logout](#acesso-e-logout-seguro)
  - [Navegação no Painel Admin](#navegação-no-painel-admin)
  - [Dashboard Administrativo](#dashboard-administrativo)
  - [Gerenciamento de Torneios](#gerenciamento-de-torneios)
  - [Gerenciamento de Jogadores (Admin)](#gerenciamento-de-jogadores-admin)
  - [Gerenciamento de Placares (Admin)](#gerenciamento-de-placares-admin)
  - [Lixeira (Admin)](#lixeira-admin)
  - [Seção de Segurança (Admin)](#seção-de-segurança-admin)
    - [Visão Geral de Segurança](#visão-geral-de-segurança)
    - [Configuração de Honeypots](#configuração-de-honeypots)
    - [Análise de Ameaças](#análise-de-ameaças)
    - [IPs Bloqueados](#ips-bloqueados)
- [Personalização e Dicas](#🎨-personalização-e-dicas)
  - [Alternador de Tema (Claro/Escuro)](#alternador-de-tema-claroescuro)
  - [Impressão](#imprimindo-chaveamentos-e-tabelas)

---

## 🎯 Domine o LASCMMG: Seu Guia Completo para Gerenciar Torneios de Sinuca

Bem-vindo ao manual oficial do Sistema de Gerenciamento de Torneios de Sinuca da LASCMMG, agora em sua moderna versão React construída com **Vite**! Este documento foi elaborado para guiar você através de todas as funcionalidades, desde a simples visualização de torneios até a administração completa.

A nova interface, construída com React, Vite e Tailwind CSS, oferece:

- **Design Moderno e Responsivo:** Adapta-se a todos os dispositivos.
- **Experiência de Usuário Aprimorada:** Navegação intuitiva, feedback visual claro e animações suaves.
- **Performance Otimizada:** Carregamento rápido e operação fluida, graças ao Vite.
- **Acessibilidade (A11y):** Foco em navegação por teclado, contraste e semântica.
- **Tema Claro/Escuro:** Com persistência de sua preferência.

## 🔑 Acessando o Sistema

A aplicação é acessada através do seu navegador web.

- **Interface Pública:** Geralmente no endereço principal (ex: `http://localhost:5173/` durante o desenvolvimento com Vite, ou `https://seudominio.com/` em produção).
- **Registro de Usuário Regular:** Se habilitado, através de um link "Registrar" ou rota específica (ex: `/register`). O campo "Email" será seu nome de usuário para login.
- **Login de Usuário Regular:** Através da rota `/login` (ou um formulário de login). Use seu email (como nome de usuário) e senha cadastrados.
- **Login Administrativo:** Geralmente através da mesma rota `/login`, mas com credenciais de administrador. O nome de usuário do administrador também é um email. A interface de login pode tentar identificar se é um admin baseado no formato do email ou oferecer uma opção.

**Nota sobre Segurança no Login:** O sistema implementa proteção contra múltiplas tentativas de login falhas. Após um certo número de tentativas incorretas, sua conta ou IP pode ser temporariamente bloqueado.

## 🖥️ Visão Geral da Interface Moderna

A interface é dividida em três áreas principais:

### Cabeçalho Principal (Topo)

- **Logo LASCMMG:** Link para a página inicial (Dashboard).
- **Menu de Navegação Principal (Desktop):** Links para Dashboard, Torneios, Jogadores, Chaves, Estatísticas.
- **Botão de Menu Lateral (Desktop):** Permite recolher/expandir a barra lateral esquerda.
- **Seletor de Torneio:** Permite escolher qual torneio visualizar/administrar.
- **Alternador de Tema:** Botão para alternar entre os modos claro e escuro.
- **Menu de Perfil:**
  - Acesso ao Perfil do Usuário (se logado).
  - Acesso a Configurações (se logado).
  - Opção de "Login" (se não logado) ou "Sair" (se logado).
- **Menu Mobile (Hambúrguer ☰):** Em dispositivos móveis, agrupa a navegação principal e opções de perfil.

### Barra Lateral de Navegação (Esquerda)

- Fornece acesso rápido às principais seções do sistema. Seu conteúdo varia se você está na área pública ou no painel administrativo.
- **Colapsável (Desktop):** Pode ser recolhida para mais espaço de conteúdo. Sua preferência é salva.
- **Deslizante (Mobile):** Otimizada para toque, fecha automaticamente ao selecionar um item.

### Área de Conteúdo Principal

É onde as informações da seção selecionada são exibidas (dashboards, tabelas, formulários, chaveamentos, etc.).

## 1. Explorando as Funcionalidades Públicas

Estas seções são acessíveis a todos os usuários, sem necessidade de login.

### Selecionando um Torneio

- Utilize o **Seletor de Torneio** no cabeçalho para escolher qual torneio ativo você deseja visualizar.
- As informações exibidas nas seções de Chaveamento, Placares e Estatísticas serão relativas ao torneio selecionado.

### Dashboard (Página Inicial)

- Acessível clicando na logo ou no link "Dashboard".
- Apresenta informações gerais ou um resumo dos torneios ativos ou recentes.

### Chaveamento (Brackets)

- Acessível pelo link "Chaves" na navegação.
- Exibe a estrutura visual das partidas do torneio selecionado (Ex: Eliminatória Simples, Dupla Eliminação - Fase de Vencedores, Fase de Perdedores, Grande Final).
- Mostra jogadores, placares (se disponíveis), status da partida e quem avança.
- Permite clicar em partidas para ver detalhes (se implementado).
- O design é responsivo para boa visualização em diferentes tamanhos de tela.

### Histórico de Placares

- Acessível pelo link "Placares" (ou similar) na navegação.
- Exibe uma tabela com todos os resultados de partidas do torneio selecionado.
- Funcionalidades de filtro e ordenação podem estar disponíveis para facilitar a busca.

### Estatísticas

- Acessível pelo link "Estatísticas" na navegação.
- Apresenta dados e gráficos sobre o desempenho dos jogadores e o andamento do torneio selecionado.

## 2. Gerenciando Torneios: O Painel Administrativo

Acesso restrito a administradores. Navegue para `/admin` após o login.

### Acesso e Logout Seguro

- **Login (Administrador):** Acesse a rota `/login` (ou o formulário de login designado). Insira seu email de administrador (que serve como nome de usuário) e senha. Você pode ter a opção "Lembrar-me" para estender a duração da sua sessão.
- **Logout:** No menu de perfil (canto superior direito), clique em "Sair". Sua sessão será encerrada e o token de acesso invalidado no backend.
- **Alteração de Senha (Administrador):** Administradores podem alterar suas próprias senhas através da página "Meu Perfil" (`/profile`). Isso requer a senha atual e a nova senha, que deve atender aos critérios de complexidade.
- **Nota Importante de Segurança para Administradores (Configuração Inicial):** Se você está configurando o sistema pela primeira vez e utilizou o script `scripts/initialize_admin.js` ou um arquivo `admin_credentials.json` para criar o primeiro administrador, é crucial que, após o primeiro login bem-sucedido e a confirmação de que o sistema está funcionando, este arquivo `admin_credentials.json` (se existir na raiz do projeto) seja **removido ou movido para um local seguro fora do servidor**. O sistema migra essas credenciais para o banco de dados, e manter o arquivo original no servidor representa um risco de segurança.

### Gerenciamento de Perfil (Usuário Regular)

Usuários regulares autenticados podem ter acesso à página "Meu Perfil" (`/profile`) para:
- **Visualizar Dados:** Ver seu nome de usuário (email) e role.
- **Alterar Senha:** Requer a senha atual e a nova senha. A nova senha deve atender aos critérios de complexidade definidos pelo sistema (mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos).

### Navegação no Painel Admin

A barra lateral no modo admin oferece links para:

- **Dashboard Admin:** Visão geral com estatísticas, ações rápidas e atividade recente.
- **Torneios:** Gerenciamento de torneios (criar, editar, listar, gerenciar estado).
- **Jogadores (Globais):** Gerenciamento de todos os jogadores do sistema (criar, editar, visualizar).
- **Usuários Admin:** Gerenciamento de contas de administrador (criar novos administradores).
- **Agendamento de Partidas:** Ferramentas para definir datas/horários de partidas.
- **Lixeira:** Gerenciar itens excluídos.
- **Segurança:** Acesso às subseções de segurança.
- **Configurações:** Configurações gerais do sistema (placeholder).
- Outros links podem incluir Relatórios, etc.

### Dashboard Administrativo (`/admin`)

- Página inicial da área administrativa (refere-se ao `admin/Dashboard.jsx` mais completo).
- Exibe cartões com estatísticas gerais (Total de Jogadores, Partidas Realizadas, Partidas Pendentes, Torneios Ativos).
- Seção de "Ações Rápidas" com links para Gerenciar Jogadores, Adicionar Placar, Configurações.
- Feed de "Atividade Recente" mostrando as últimas criações/atualizações de torneios, jogadores e placares.

### Gerenciamento de Torneios

- **Listagem (`/admin/tournaments`):** Visualiza todos os torneios com opções de paginação. Ações rápidas para editar, gerenciar estado/chaveamento, excluir (soft delete), e gerar chaveamento (para torneios pendentes).
- **Criação (`/admin/tournaments/create`):** Formulário para criar um novo torneio. Campos incluem Nome, Data, Descrição, Tipo de Chaveamento (Eliminatória Simples, Dupla Eliminação, Todos contra Todos), Nº Esperado de Jogadores, Taxa de Inscrição, Premiação, Regras e Status inicial (Pendente, Em Andamento, etc.).
- **Edição (`/admin/tournaments/edit/:id`):** Formulário similar ao de criação para editar um torneio existente.
- **Gerenciamento Específico (`/admin/tournaments/manage/:id`):** Página para gerenciar um torneio individualmente, incluindo:
    - Adicionar jogadores existentes (globais) ao torneio.
    - Visualizar jogadores inscritos.
    - Gerar/resetar chaveamento.
    - Link para visualização pública do chaveamento.
    - (Futuro) Gerenciamento de partidas e resultados diretamente nesta página.

### Gerenciamento de Jogadores (Admin)

- **Página Principal de Jogadores (`/admin/players`):**
    - Lista todos os jogadores "globais" (não necessariamente vinculados a um torneio específico no momento da criação/edição nesta página).
    - Oferece visualização em tabela ou cartões, com opções de busca, filtros (gênero, nível de habilidade), ordenação e paginação.
    - Ações de edição e exclusão lógica (mover para lixeira) para cada jogador.
    - Funcionalidade de seleção múltipla para exclusão em massa.
- **Criação de Jogador Global (`/admin/players/create` ou via modal em `/admin/players`):**
    - Formulário para adicionar um novo jogador ao sistema. Campos: Nome (obrigatório), Apelido, Email (opcional, mas único globalmente se preenchido), Gênero (Masculino, Feminino, Outro), Nível de Habilidade (Iniciante, Intermediário, Avançado, Profissional).
- **Edição de Jogador Global (`/admin/players/edit/:id` ou via modal):**
    - Formulário similar para editar os detalhes de um jogador existente.
- **Importação de Jogadores para um Torneio:**
    - Realizada na página de gerenciamento de um torneio específico (`/admin/tournaments/manage/:id`), através de um modal que aceita um arquivo JSON com a lista de jogadores. Campos esperados no JSON: `PlayerName` (obrigatório), `Nickname`, `gender`, `skill_level`.

### Gerenciamento de Placares (Admin)

- **Adição de Placar (`/match/:matchId/add-score`):** Página dedicada para registrar o placar de uma partida específica. Requer seleção de torneio e partida. O formulário inclui campos para os placares dos dois jogadores e, em caso de empate nos pontos, um seletor manual de vencedor.
- **Edição de Placares (Tabela em `/admin` ou página específica):**
    - A tabela de "Gerenciamento de Placares" no Dashboard Admin (`admin/Dashboard.jsx` mais simples) ou uma página dedicada (`AdminScoresTable.jsx` se usada isoladamente) lista os placares registrados.
    - Permite editar os pontos de cada jogador e a rodada.
    - Exclusão lógica de placares.

### Gerenciamento de Administradores (`/admin/users`)
- Lista os administradores existentes (username/email, role, último login, data de criação).
- Formulário para criar novos administradores:
    - **Email (para Username):** O nome de usuário do novo admin deve ser um endereço de email válido.
    - **Senha:** Deve atender aos critérios de complexidade (mínimo 8 caracteres, maiúsculas, minúsculas, números, símbolos).
    - **Confirmação de Senha.**
- Atualmente, a edição e exclusão de outros administradores não está implementada na UI.

### Agendamento de Partidas (`/admin/match-schedule`)
- Permite que administradores definam ou alterem a data e hora de partidas específicas de um torneio.
- Requer a inserção do ID do torneio para carregar suas partidas.
- Cada partida listada terá um campo de data/hora editável e um botão para salvar o agendamento.

### Lixeira (Admin) (`/admin/trash`)

- Lista itens que foram "excluídos" (soft delete), como jogadores, placares ou torneios (status "Cancelado").
- Permite restaurar itens para seu estado ativo ou excluí-los permanentemente do sistema.
- Filtros por tipo de item (Torneio, Jogador, Placar) estão disponíveis.

### Seção de Segurança (Admin) (`/admin/security`)

Acessada pelo link "Segurança" no menu admin, leva a um layout específico com sub-navegação:

#### Visão Geral de Segurança (`/admin/security/overview` ou `/admin/security`)

- Exibe estatísticas de segurança: total de eventos de ameaça (ex: tentativas de login falhas, acessos a honeypots), IPs únicos envolvidos.
- Lista de endpoints honeypot ativos.
- Gráfico dos principais padrões de ataque detectados (se aplicável).
- Tabela de atividades suspeitas recentes ou eventos de segurança importantes.

#### Configuração de Honeypots (`/admin/security/honeypots`)

- Lista de endpoints honeypot ativos (se configurável dinamicamente, senão informativo).
- Formulário para configurar parâmetros do sistema de bloqueio de IP baseado em honeypot:
  - Limite de acessos a honeypots para um IP ser bloqueado.
  - Duração do bloqueio de IP (em horas).
  - Lista de IPs na whitelist (um por linha, para evitar bloqueio acidental).

#### Análise de Ameaças (`/admin/security/threat-analytics`)

- Exibirá gráficos detalhados sobre distribuição de padrões de ataque, atividade ao longo do tempo e, se possível, distribuição geográfica de ameaças, conforme os dados e APIs correspondentes forem implementados e disponíveis.

#### IPs Bloqueados (`/admin/security/blocked-ips`)

- Formulário para adicionar um bloqueio manual de IP (endereço IP, duração, motivo).
- Tabela listando todos os IPs atualmente bloqueados (automaticamente ou manualmente), com informações sobre desde quando, até quando, motivo do bloqueio e opção para desbloquear um IP específico.
- Paginação para a lista de IPs bloqueados.

## 🎨 Personalização e Dicas

### Alternador de Tema (Claro/Escuro)

- No cabeçalho, procure pelo ícone de Sol (☀️) ou Lua (🌙).
- Clique para alternar entre o tema claro e escuro. Sua preferência é salva no navegador.

### Impressão

- Navegue até a seção desejada (ex: Chaveamento, Histórico de Placares).
- Use a função de impressão do seu navegador (Ctrl+P ou Cmd+P).
- O sistema possui estilos otimizados para impressão, removendo elementos de navegação e ajustando o conteúdo para melhor legibilidade no papel.
- Para chaveamentos grandes, a orientação paisagem (landscape) na configuração de impressão pode ser mais adequada.

---

Esperamos que este manual torne sua experiência com o LASCMMG (Versão React com Vite) a mais fluida e produtiva possível!

[⬆ Voltar ao topo](#manual-do-usuário---sistema-lascmmg-versão-react-com-vite) | [Voltar ao README Principal](README.md)
