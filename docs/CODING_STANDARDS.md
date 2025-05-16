# Padrões de Codificação - LASCMMG

## 🆕 Atualizações Recentes

- Todos os imports de módulos JavaScript no frontend e backend foram revisados e corrigidos para usar caminhos relativos corretos, eliminando erros de importação.
- Estrutura de pastas padronizada e modularizada para facilitar manutenção e escalabilidade.
- Garantia de boas práticas de UI/UX, acessibilidade (A11y) e responsividade em todas as telas.
- Scripts, handlers e documentação revisados para refletir a estrutura real do projeto e facilitar onboarding de novos desenvolvedores.

[⬅ Voltar ao README](README.md)

## Índice

- [Princípios Gerais](#1-princípios-gerais)
- [Formatação do Código](#2-formatação-do-código)
- [Convenções de Nomenclatura](#3-convenções-de-nomenclatura)
- [JavaScript (Backend e Frontend)](#4-javascript-backend-e-frontend)
- [HTML](#5-html)
- [CSS](#6-css)
- [Documentação do Código](#7-documentação-do-código)
- [Testes](#8-testes)
- [Controle de Versão (Git)](#9-controle-de-versão-git)
- [Conformidade e Aplicação](#10-conformidade-e-aplicação)

---

## ✍️ Diretrizes para um Código Consistente, Legível e de Alta Qualidade

Este documento estabelece os padrões de codificação e práticas recomendadas para todos os colaboradores do projeto LASCMMG (Sistema de Gerenciamento de Torneios de Sinuca). Seguir estas diretrizes é fundamental para manter a consistência, legibilidade, manutenibilidade e qualidade do código em todo o projeto.

Nosso objetivo é criar um código que seja fácil de entender, modificar e expandir, promovendo a colaboração eficiente entre os membros da equipe.

## 📑 Índice

1. [Princípios Gerais](#princípios-gerais)
2. [Formatação do Código](#formatação-do-código)
3. [Convenções de Nomenclatura](#convenções-de-nomenclatura)
4. [JavaScript (Backend e Frontend)](#javascript-backend-e-frontend)
5. [HTML](#html)
6. [CSS](#css)
7. [Documentação do Código](#documentação-do-código)
8. [Testes](#testes)
9. [Controle de Versão (Git)](#controle-de-versão-git)
10. [Conformidade e Aplicação](#conformidade-e-aplicação)

## 1. Princípios Gerais

* **Clareza é Prioridade:** Escreva código que seja fácil de ler e entender. Seções complexas devem ser explicadas com comentários ou documentação.
* **Consistência:** Mantenha um estilo consistente em todo o projeto, mesmo que difira de suas preferências pessoais.
* **Simplicidade:** Prefira soluções simples e diretas a abordagens excessivamente complexas.
* **DRY (Don't Repeat Yourself):** Evite duplicação de código. Refatore lógicas comuns em funções ou módulos reutilizáveis.
* **KISS (Keep It Simple, Stupid):** Mantenha as coisas o mais simples possível.
* **Responsabilidade Única:** Módulos, classes e funções devem ter uma única responsabilidade bem definida.

## 2. Formatação do Código

A formatação é automatizada para garantir consistência.

### Geral

* Utilize **2 espaços** para indentação em todos os arquivos.
* Mantenha as linhas com no máximo **80 caracteres** (configuração padrão do Prettier). Ajustes podem ser feitos em `.prettierrc.json` se houver um consenso da equipe.
* Evite linhas em branco desnecessárias, especialmente no fim dos arquivos.
* Certifique-se de que todos os arquivos terminem com uma nova linha.
* Use codificação **UTF-8 sem BOM** para todos os arquivos.

### Automação de Formatação e Linting

Utilizamos ferramentas para automatizar a formatação e identificar problemas de código:

* **Prettier:** Garante a formatação consistente do código. A configuração está em `.prettierrc.json`.
* **ESLint:** Analisa o código JavaScript para encontrar erros, problemas de estilo e práticas questionáveis. A configuração está em `eslint.config.mjs`.

**Comandos Úteis:**

```bash
# Formata todos os arquivos do projeto
npm run format

# Executa a análise estática do código JavaScript
npm run lint

# Tenta corrigir automaticamente os problemas identificados pelo ESLint
npm run lint:fix
```

**Recomendação:** Configure seu editor de código (VSCode, etc.) para rodar Prettier e ESLint automaticamente ao salvar arquivos.

## 3. Convenções de Nomenclatura

Nomes devem ser descritivos e refletir a intenção.

### Arquivos e Diretórios

* Use substantivos para arquivos que contêm classes ou agrupamentos lógicos de funções (modelos, handlers): `tournamentModel.js`, `bracketHandler.js`.
* Use **camelCase** para arquivos JavaScript: `apiService.js`, `uiUtils.js`.
* Use **kebab-case** para arquivos CSS e HTML: `admin.css`, `index.html`, `faculdade-theme.css`.

### Código (Variáveis, Funções, Classes, Constantes)

* Use **camelCase** para variáveis, funções e métodos:

    ```javascript
    const playerName = 'João';
    function calculateScore() { /* ... */ }
    async function fetchUserData() { /* ... */ }
    ```

* Use **PascalCase** para classes e construtores:

    ```javascript
    class TournamentManager { /* ... */ }
    class Player { /* ... */ }
    ```

* Use **UPPER_SNAKE_CASE** para constantes globais ou de módulo que representam valores fixos e imutáveis:

    ```javascript
    const MAX_PLAYERS = 32;
    const API_BASE_URL = '/api';
    const DEFAULT_TIMEOUT_MS = 5000;
    ```

* Use prefixo `is`, `has`, `can` ou similar para variáveis booleanas:

    ```javascript
    const isActive = true;
    const hasPermission = checkUserPermission();
    let canEdit = false;
    ```

* Evite abreviações excessivas que possam dificultar a compreensão.

## 4. JavaScript (Backend e Frontend)

### Estrutura e Padrões

* Utilize **ES6+ (ECMAScript 2015 e superior)**.
* **Módulos:**
    * O código do **backend** (`server.js`, `routes/`, `lib/`, `scripts/`) utiliza **CommonJS** (`require`/`module.exports`).
    * O código do **frontend** (`js/`) utiliza **Módulos ESM** (`import`/`export`).
* Organize o código em módulos com responsabilidades bem definidas (Princípio da Responsabilidade Única).
* Prefira funções nomeadas a funções anônimas para facilitar a depuração e o rastreamento de stack traces.
* Use arrow functions (`=>`) para callbacks curtos, para manter o contexto de `this` (quando necessário) ou para maior concisão em funções simples.

### Práticas Recomendadas

* Use **destructuring** para acessar propriedades de objetos e elementos de arrays de forma concisa.
* Utilize **parâmetros padrão** para definir valores default para argumentos de função.
* Use o operador **spread (`...`)** para expandir iteráveis ou copiar objetos/arrays.
* Use o operador **rest (`...`)** para coletar múltiplos argumentos de função em um array.
* Prefira métodos funcionais de array (`map`, `filter`, `reduce`, `forEach`, `some`, `every`, etc.) a loops `for` tradicionais quando a operação for clara e a imutabilidade for beneficiada.
* Use **encadeamento opcional (`?.`)** e o **operador de coalescência nula (`??`)** para lidar com valores `null` ou `undefined` de forma segura e concisa.
* Sempre use **`===` e `!==`** (igualdade/desigualdade estrita) em vez de `==` e `!=` para evitar coerção de tipo inesperada.
* Gerencie Promises usando **`async/await`** para código assíncrono mais legível. Sempre utilize blocos `try...catch` em funções `async` para tratar erros.

### Manipulação do DOM (Frontend)

* Armazene referências a elementos DOM frequentemente acessados em variáveis.
* Use **delegação de eventos** para otimizar performance ao lidar com múltiplos elementos similares.
* Prefira `textContent` a `innerHTML` para inserir texto simples por segurança (previne XSS). Use `innerHTML` com cautela e apenas com conteúdo proveniente de fontes confiáveis ou após sanitização rigorosa.
* Utilize métodos DOM modernos sempre que possível.

### Tratamento de Erros

* Use blocos `try...catch` para capturar e tratar exceções de forma controlada.
* Registre informações detalhadas de erro utilizando o sistema de logs do projeto (`lib/logger.js`).
* Forneça feedback claro e útil ao usuário em caso de erros na interface.

## 5. HTML

### Estrutura e Semântica

* Use **HTML5 semântico** (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`, etc.) para estruturar o conteúdo de forma lógica e acessível.
* Use a doctype HTML5: `<!DOCTYPE html>`.
* Organize o documento com cabeçalhos (`<h1>` a `<h6>`) aninhados corretamente para definir a estrutura do conteúdo.
* Inclua o atributo `lang="pt-BR"` no elemento `<html>` para indicar o idioma principal da página.

### Práticas Recomendadas para HTML

* Use **IDs** para identificar elementos únicos na página (geralmente para JavaScript ou links âncora).
* Prefira **classes** para estilização e seleção de múltiplos elementos com JavaScript.
* Utilize atributos **`data-*`** para armazenar informações personalizadas não visuais associadas a elementos HTML, que podem ser acessadas via JavaScript.

### Acessibilidade (A11y)

* Inclua o atributo `alt` descritivo para todas as imagens de conteúdo. Para imagens puramente decorativas, use `alt=""`.
* Use elementos semânticos nativos sempre que possível. Complemente com atributos **ARIA** (`aria-*`) quando a semântica nativa não for suficiente para descrever a função ou estado de um elemento interativo.
* Garanta que todos os controles de formulário (`<input>`, `<textarea>`, `<select>`) tenham rótulos (`<label>`) associados corretamente (usando o atributo `for` ou aninhamento).
* Verifique a ordem de foco dos elementos interativos para garantir uma navegação lógica por teclado.

## 6. CSS

### Organização e Estrutura

* Organize o CSS em arquivos separados por escopo ou funcionalidade para melhor manutenibilidade (ex: `style.css` para estilos gerais, `admin.css` para a área admin, arquivos para temas específicos).
* Use **seletores de classe** como padrão. Evite seletores de ID para estilização, pois eles têm alta especificidade e dificultam a reutilização.
* Prefira classes específicas e evite seletores aninhados profundamente (`.sidebar ul li a`) que tornam o CSS frágil e difícil de sobrescrever.

### Convenções

* Use **kebab-case** para nomes de classes CSS (`.nav-item`, `.btn-primary`).
* Organize as propriedades CSS dentro de uma regra de forma consistente (ex: por tipo - layout, box model, typography, visual; ou alfabeticamente).
* Utilize **variáveis CSS (`--nome-da-variavel`)** para definir cores, espaçamentos, tamanhos de fonte, etc., promovendo a consistência visual e facilitando a criação de temas.

### Responsividade

* Utilize **media queries** para adaptar o layout e o estilo a diferentes tamanhos de tela e dispositivos.
* Considere uma abordagem **mobile-first**, começando a estilizar para telas menores e adicionando regras para telas maiores com media queries (`min-width`).
* Use **unidades relativas** (rem, em, %, vw, vh) em vez de unidades fixas (px) sempre que apropriado para garantir que os elementos escalem corretamente.

## 7. Documentação do Código

Um código bem documentado é mais fácil de entender e manter.

### Comentários

* Use comentários para explicar o "porquê" de uma decisão de design ou de uma lógica complexa, não o "o quê" (se o código for autoexplicativo).
* Remova código comentado obsoleto.

### JSDoc

* Documente todas as funções públicas, classes, métodos e módulos utilizando blocos de comentários **JSDoc**.
* Para funções, inclua:
    * Uma breve descrição da sua finalidade.
    * `@param {Tipo} nomeParametro - Descrição do parâmetro.` para cada parâmetro.
    * `@returns {Tipo} Descrição do valor de retorno.`
    * `@throws {Error} Descrição da exceção lançada.` (se aplicável).

    ```javascript
    /**
     * Calcula o resultado final de uma partida com base nos placares.
     * @param {number} scorePlayer1 - Placar do jogador 1.
     * @param {number} scorePlayer2 - Placar do jogador 2.
     * @returns {string} O resultado da partida ('Jogador 1 Vence', 'Jogador 2 Vence', 'Empate').
     * @throws {Error} Se os placares forem negativos.
     */
    function determineMatchResult(scorePlayer1, scorePlayer2) {
      if (scorePlayer1 < 0 || scorePlayer2 < 0) {
        throw new Error('Placares não podem ser negativos.');
      }
      // ... lógica ...
    }
    ```

## 8. Testes

Testes automatizados são essenciais para garantir a estabilidade e prevenir regressões.

### Ferramentas e Configuração

* O projeto utiliza **Vitest** como framework de testes unitários.
* O ambiente de teste para código que interage com o DOM é simulado usando **jsdom**.
* A configuração do Vitest encontra-se em `vitest.config.js`.

### Organização

* Arquivos de teste unitário estão localizados no diretório `tests/unit/`.
* Nomeie os arquivos de teste seguindo o padrão `nomeDoModulo.test.js` (ex: `securityUtils.test.js`, `tournamentModel.test.js`).
* Agrupe testes relacionados logicamente usando blocos `describe`.

### Práticas de Escrita de Testes

* Escreva testes claros, concisos e descritivos usando `test` (ou `it`).
* Siga o padrão **Arrange-Act-Assert (AAA)**:
    1. **Arrange:** Configure o ambiente de teste e os dados necessários.
    2. **Act:** Execute a ação ou função que está sendo testada.
    3. **Assert:** Verifique se o resultado da ação é o esperado.
* Teste casos de sucesso, casos de borda (edge cases) e casos de falha/erro.
* Use mocks, stubs ou spies para isolar a unidade de código sendo testada e gerenciar dependências externas (como chamadas de API ou acesso a banco de dados) em testes unitários.

## 9. Controle de Versão (Git)

Utilizamos Git para gerenciar o histórico do código.

### Commits

* Escreva mensagens de commit claras, concisas e informativas.
* A primeira linha do commit deve ser um resumo (máx. 50 caracteres).
* Deixe uma linha em branco e, se necessário, adicione um corpo mais detalhado.
* Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) para o resumo, facilitando a automação de changelogs e a compreensão do histórico:
    * `feat: Adiciona funcionalidade X` (Nova funcionalidade)
    * `fix: Corrige bug Y` (Correção de bug)
    * `docs: Atualiza manual do usuário` (Alterações na documentação)
    * `style: Formata arquivos com Prettier` (Mudanças de estilo, sem alteração na lógica)
    * `refactor: Refatora módulo Z` (Refatoração de código, sem mudança de funcionalidade)
    * `test: Adiciona testes para W` (Adição ou correção de testes)
    * `chore: Atualiza dependência A` (Tarefas de manutenção, build, etc.)
* Faça commits pequenos e atômicos, focando em uma única mudança lógica por commit.

### Branches

* Utilize branches para desenvolver novas features, corrigir bugs ou experimentar (`feature/nome-da-feature`, `fix/problema-corrigido`, `chore/tarefa-de-manutencao`).
* Mantenha a branch principal (`main` ou `master`) sempre estável e pronta para implantação.
* Faça merge de suas branches de feature/fix na branch principal via Pull Requests (PRs).

### Pull Requests (PRs)

* Mantenha os PRs pequenos e focados em uma única feature ou correção.
* Inclua descrições detalhadas do que o PR faz, por que foi feito e como testar.
* Referencie issues relevantes (ex: `Fixes #123`, `Closes #456`).
* Garanta que todos os testes e verificações de lint/formatação passem antes de solicitar revisão.
* Participe ativamente do processo de revisão, respondendo a comentários e fazendo as alterações solicitadas.

## 10. Conformidade e Aplicação

Estas diretrizes são ativamente reforçadas para manter a qualidade do código:

1. **Configurações de Ferramentas:** ESLint e Prettier são configurados para sinalizar e corrigir automaticamente muitos problemas de estilo e qualidade.
2. **Hooks de Git (Recomendado):** Considere configurar hooks de pré-commit (ex: usando Husky e lint-staged) para rodar formatadores e linters automaticamente antes de cada commit.
3. **Revisões de Código:** Todos os Pull Requests devem ser revisados por pelo menos um outro membro da equipe antes de serem mesclados.

Para verificar a conformidade manualmente, execute:

```bash
npm run format # Para formatar
npm run lint   # Para verificar problemas
npm run lint:fix # Para tentar corrigir problemas automaticamente
npm test       # Para rodar os testes
```

---

Seguindo estes padrões, contribuímos para um projeto LASCMMG mais robusto, manutenível e colaborativo. Boas codificações!

---

[⬆ Voltar ao topo](#padrões-de-codificação---lascmmg) | [Voltar ao README](README.md)
