# Manual do Usuário - Sistema LASCMMG (Versão React com Vite)

[⬅ Voltar ao README Principal](README.md)

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
- **Login Administrativo:** Através da rota `/login`.

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

- **Login:** Acesse a rota `/login`. Insira seu nome de usuário e senha.
- **Logout:** No menu de perfil (canto superior direito), clique em "Sair".
- **Nota Importante de Segurança para Administradores (Configuração Inicial):** Se você está configurando o sistema pela primeira vez e utilizou o script `scripts/initialize_admin.js` ou um arquivo `admin_credentials.json` para criar o primeiro administrador, é crucial que, após o primeiro login bem-sucedido e a confirmação de que o sistema está funcionando, este arquivo `admin_credentials.json` (se existir na raiz do projeto) seja **removido ou movido para um local seguro fora do servidor**. O sistema migra essas credenciais para o banco de dados, e manter o arquivo original no servidor representa um risco de segurança.

### Navegação no Painel Admin

A barra lateral no modo admin oferece links para:

- **Dashboard Admin:** Visão geral da administração.
- **Torneios:** Gerenciamento de torneios (criar, editar, listar).
- **Jogadores:** Gerenciamento de jogadores (associados ao torneio admin ativo).
- **Placares:** Gerenciamento de placares (associados ao torneio admin ativo).
- **Lixeira:** Gerenciar itens excluídos.
- **Segurança:** Acesso às subseções de segurança.
- Outros links podem incluir Agendamento, Configurações do Sistema, etc.

### Dashboard Administrativo (`/admin`)

- Página inicial da área administrativa.
- Exibe tabelas para gerenciamento rápido de Jogadores, Placares e Itens na Lixeira.
- Permite adicionar, editar e excluir itens diretamente das tabelas através de modais.

### Gerenciamento de Torneios

- Acesse via link "Torneios" no menu admin.
- Funcionalidades para criar novos torneios, editar detalhes (nome, data, descrição, tipo, taxas, regras), definir status (Pendente, Em Andamento, Concluído, Cancelado).
- Visualização da lista de todos os torneios com opções de filtro e busca.

### Gerenciamento de Jogadores (Admin)

- Acessível pela tabela no Dashboard Admin ou um link dedicado (geralmente contextual ao torneio selecionado).
- Permite adicionar novos jogadores a um torneio, editar informações (nome, apelido, gênero, nível de habilidade) e realizar exclusão lógica (soft delete).
- Funcionalidade para importar lista de jogadores para um torneio.

### Gerenciamento de Placares (Admin)

- Acessível pela tabela no Dashboard Admin ou um link dedicado (contextual ao torneio).
- Permite adicionar ou editar placares de partidas, definir o vencedor.
- As atualizações de placar refletem automaticamente no chaveamento.
- Exclusão lógica de placares incorretos.

### Lixeira (Admin)

- Acessível pela tabela no Dashboard Admin ou um link dedicado.
- Lista itens que foram "excluídos" (soft delete), como jogadores, placares ou torneios (status "Cancelado").
- Permite restaurar itens para seu estado ativo ou excluí-los permanentemente do sistema.
- Filtros por tipo de item (Torneios, Jogadores, Placares) podem estar disponíveis.

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
