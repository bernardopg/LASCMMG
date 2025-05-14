# Padrões de Codificação - LASCMMG

Este documento estabelece os padrões de codificação e práticas recomendadas para o projeto LASCMMG (Sistema de Gerenciamento de Torneios de Sinuca). Ele serve como guia para manter a consistência, legibilidade e qualidade do código em todo o projeto.

## Índice

1. [Formatação do Código](#formatação-do-código)
2. [Convenções de Nomenclatura](#convenções-de-nomenclatura)
3. [JavaScript](#javascript)
4. [HTML](#html)
5. [CSS](#css)
6. [Documentação do Código](#documentação-do-código)
7. [Testes](#testes)
8. [Controle de Versão](#controle-de-versão)

## Formatação do Código

### Geral

- Utilize **2 espaços** para indentação em todos os arquivos (controlado pelo Prettier).
- Mantenha as linhas com no máximo **80 caracteres** (configuração padrão do Prettier, pode ser ajustado em `.prettierrc.json` se necessário).
- Evite linhas em branco no fim dos arquivos.
- Certifique-se de que todos os arquivos terminem com uma nova linha.
- Use codificação UTF-8 sem BOM para todos os arquivos.

### Automação de Formatação

- Use **Prettier** para garantir a formatação consistente. O projeto já possui `.prettierrc.json`. Execute:

  ```bash
  npm run format
  ```

- Use **ESLint** para verificar a qualidade do código JavaScript. O projeto já possui `eslint.config.mjs`. Execute:

  ```bash
  npm run lint
  npm run lint:fix
  ```

## Convenções de Nomenclatura

### Arquivos e Diretórios

- Use substantivos para arquivos que contêm classes ou agrupamentos lógicos de funções (modelos, handlers): `tournamentModel.js`, `bracketHandler.js`.
- Use **camelCase** para arquivos JavaScript: `apiService.js`, `uiUtils.js`.
- Use **kebab-case** para arquivos CSS e HTML: `admin.css`, `index.html`, `faculdade-theme.css`.

### Código

- Use **camelCase** para variáveis, funções e métodos:

  ```javascript
  const playerName = 'João';
  function calculateScore() { /* ... */ }
  ```

- Use **PascalCase** para classes e construtores:

  ```javascript
  class TournamentManager { /* ... */ }
  ```

- Use **UPPER_SNAKE_CASE** para constantes globais ou de módulo:

  ```javascript
  const MAX_PLAYERS = 32;
  const API_BASE_URL = '/api';
  ```

- Use prefixo `is`, `has`, ou similar para variáveis booleanas:

  ```javascript
  const isActive = true;
  const hasPermission = checkUserPermission();
  ```

- Use nomes descritivos que revelem intenção. Evite abreviações excessivas.

## JavaScript

### Estrutura Geral

- Use ES6+ (ECMAScript 2015 e superior).
- **Módulos**:
  - O código do **backend** (`server.js`, `routes/`, `lib/`, `scripts/`) utiliza **CommonJS** (`require`/`module.exports`).
  - O código do **frontend** (`js/`) utiliza **Módulos ESM** (`import`/`export`).
- Organize o código em módulos com responsabilidades bem definidas.
- Prefira funções nomeadas a funções anônimas para facilitar a depuração.
- Use arrow functions para callbacks curtos e quando o contexto de `this` não for um problema.

### Práticas Recomendadas

- Use destructuring para acessar propriedades de objetos e arrays.
- Utilize parâmetros padrão e o operador spread/rest quando apropriado.
- Prefira métodos funcionais de array (`map`, `filter`, `reduce`, etc.) a loops `for` tradicionais quando a legibilidade e a imutabilidade forem beneficiadas.
- Use encadeamento opcional (`?.`) e o operador de coalescência nula (`??`).
- Sempre use `===` e `!==` (igualdade/desigualdade estrita).

### Manipulação do DOM (Frontend)

- Armazene referências a elementos DOM frequentemente acessados.
- Use delegação de eventos para otimizar performance.
- Prefira `textContent` a `innerHTML` para inserir texto simples por segurança. Use `innerHTML` com cautela e apenas com conteúdo sanitizado.
- Utilize métodos DOM modernos.

### Tratamento de Erros

- Use blocos `try...catch` para capturar exceções.
- Registre informações detalhadas de erro no console.
- Forneça feedback claro ao usuário em caso de erros.

### Código Assíncrono

- Prefira `async/await` para código assíncrono.
- Sempre trate rejeições de Promises.

## HTML

### Estrutura e Semântica

- Use HTML5 semântico (`<header>`, `<nav>`, `<main>`, etc.).
- Use a doctype HTML5: `<!DOCTYPE html>`.
- Organize o documento de forma lógica com cabeçalhos (`<h1>` a `<h6>`) corretamente aninhados.
- Inclua `lang="pt-BR"` no elemento `<html>`.

### Práticas Recomendadas para HTML

- Use IDs para elementos únicos.
- Prefira classes para estilização e seleção de múltiplos elementos.
- Utilize atributos `data-*` para informações específicas para JavaScript.

### Acessibilidade (A11y)

- Inclua `alt` descritivos para imagens de conteúdo. Para imagens decorativas, `alt=""`.
- Use elementos semânticos e atributos ARIA quando necessário.
- Garanta que controles de formulário tenham rótulos associados.
- Garanta uma ordem de foco lógica e navegabilidade por teclado.

## CSS

### Organização e Estrutura

- Organize o CSS em arquivos separados por escopo.
- Use seletores de classe como padrão. Evite seletores de ID para estilização.
- Prefira classes específicas a seletores aninhados profundamente.

### Convenções

- Use **kebab-case** para nomes de classes CSS (`.nav-item`).
- Organize as propriedades CSS de forma consistente.
- Utilize **variáveis CSS (`--var-name`)** para cores, espaçamentos, fontes, etc.

### Responsividade

- Use media queries para design responsivo.
- Considere mobile-first.
- Use unidades relativas (rem, em, %, vw, vh).

## Documentação do Código

### Comentários

- Explique o "porquê" de lógicas complexas, não o "o quê" se o código for claro.
- Use blocos de comentários JSDoc para documentar funções, classes e módulos.

### JSDoc

- Documente todas as funções públicas, classes e módulos.
- Para funções, documente parâmetros (`@param`), valor de retorno (`@returns`), e exceções (`@throws`).

  ```javascript
  /**
   * Descrição da função.
   * @param {string} paramName - Descrição do parâmetro.
   * @returns {boolean} Descrição do retorno.
   */
  function minhaFuncao(paramName) { /* ... */ }
  ```

## Testes

### Ferramentas e Configuração

- O projeto utiliza **Vitest** como framework de testes.
- O ambiente de teste para o DOM é simulado usando **jsdom**.
- A configuração do Vitest encontra-se em `vitest.config.js`.

### Organização

- Arquivos de teste unitário estão localizados em `tests/unit/`.
- Nomeie os arquivos de teste seguindo o padrão `nomeDoModulo.test.js` (ex: `securityUtils.test.js`).
- Agrupe testes logicamente usando `describe`.

### Práticas

- Escreva testes claros e descritivos com `test` (ou `it`).
- Siga o padrão Arrange-Act-Assert (AAA).
- Teste casos de sucesso, casos de borda e casos de falha.
- Use mocks ou stubs para dependências externas em testes unitários.

## Controle de Versão (Git)

### Commits

- Escreva mensagens de commit claras e concisas.
- Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: (nova funcionalidade)`
  - `fix: (correção de bug)`
  - `docs: (alterações na documentação)`
  - `style: (formatação, etc.; sem mudança de código)`
  - `refactor: (refatoração de código)`
  - `test: (adição ou correção de testes)`
  - `chore: (atualização de build, pacotes, etc.)`
- Faça commits pequenos e atômicos.

### Branches

- Use branches para features e fixes (`feature/nome-da-feature`, `fix/problema-corrigido`).
- Mantenha a branch principal (`main` ou `master`) estável.
- Faça merge via Pull Requests (PRs).

### Pull Requests (PRs)

- Mantenha PRs pequenos e focados.
- Inclua descrições detalhadas.
- Referencie issues, se aplicável.
- Garanta que testes e lint passem antes de solicitar revisão.
- Responda a comentários de revisão.

## Conformidade e Aplicação

Estas diretrizes são reforçadas através de:

1. Configurações do ESLint e Prettier.
2. Hooks de pré-commit (recomendado configurar com Husky e lint-staged).
3. Revisões de código em Pull Requests.

Para aplicar formatações e verificações manualmente:

```bash
npm run format
npm run lint
npm run lint:fix
```

---
Estas diretrizes são um documento vivo e podem ser atualizadas.
