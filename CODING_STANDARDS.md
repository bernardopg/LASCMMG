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

- Utilize **2 espaços** para indentação em todos os arquivos.
- Mantenha as linhas com no máximo **100-120 caracteres** (ajustável, mas evite linhas excessivamente longas).
- Evite linhas em branco no fim dos arquivos.
- Certifique-se de que todos os arquivos terminem com uma nova linha.
- Use codificação UTF-8 sem BOM para todos os arquivos.

### Automação de Formatação

- Use **Prettier** para garantir a formatação consistente. O projeto já possui `prettierrc.json`.

  ```bash
  npm run format
  ```

- Use **ESLint** para verificar a qualidade do código JavaScript. O projeto já possui `eslint.config.mjs`.

  ```bash
  npm run lint
  npm run lint:fix
  ```

## Convenções de Nomenclatura

### Arquivos e Diretórios

- Use substantivos para arquivos que contêm classes ou agrupamentos lógicos de funções (modelos, handlers): `tournamentModel.js`, `bracketHandler.js`.
- Use **camelCase** para arquivos JavaScript: `apiService.js`, `uiUtils.js`.
- Use **kebab-case** para arquivos CSS e HTML: `admin.css`, `index.html`, `faculdade-theme.css`.
- Use **PascalCase** para classes JavaScript (ex: `class ThemeSwitcher { ... }`).

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
  const API_BASE_URL = '/api'; // Exemplo
  ```

- Use prefixo `is`, `has`, ou similar para variáveis booleanas:

  ```javascript
  const isActive = true;
  const hasPermission = checkUserPermission();
  ```

- Use nomes descritivos que revelem intenção. Evite abreviações excessivas.

## JavaScript

### Estrutura Geral

- Use ES6+ (ECMAScript 2015 e superior) e módulos ESM (`import`/`export`).
- Organize o código em módulos com responsabilidades bem definidas (ex: `apiService.js`, `uiUtils.js`, handlers específicos por seção).
- Prefira funções nomeadas a funções anônimas para facilitar a depuração e rastreamento de pilha.
- Use arrow functions para callbacks curtos e quando o contexto de `this` não for um problema.

### Práticas Recomendadas

- Use destructuring para acessar propriedades de objetos e arrays.
- Utilize parâmetros padrão e o operador spread/rest quando apropriado.
- Prefira métodos funcionais de array (`map`, `filter`, `reduce`, `forEach`, `find`, `some`, `every`) a loops `for` tradicionais quando a legibilidade e a imutabilidade forem beneficiadas.
- Use encadeamento opcional (`?.`) e o operador de coalescência nula (`??`) para lidar com valores potencialmente nulos ou indefinidos.
- Sempre use `===` e `!==` (igualdade/desigualdade estrita) em vez de `==` e `!=`.

### Manipulação do DOM

- Armazene referências a elementos DOM frequentemente acessados em variáveis no escopo apropriado.
- Use delegação de eventos para lidar com múltiplos elementos dinâmicos ou para otimizar performance.
- Prefira `textContent` a `innerHTML` para inserir texto simples, por segurança (prevenção de XSS). Use `innerHTML` com cautela e apenas com conteúdo sanitizado ou controlado.
- Utilize métodos DOM modernos (`querySelector`, `querySelectorAll`, `classList`, `append`, `prepend`, etc.).

### Tratamento de Erros

- Use blocos `try...catch` para capturar e lidar com exceções em operações que podem falhar (ex: chamadas de API, parsing de JSON).
- Registre informações detalhadas de erro no console para depuração.
- Forneça feedback claro ao usuário em caso de erros (ex: usando `uiUtils.showMessage`).

### Código Assíncrono

- Prefira `async/await` a cadeias de Promises (`.then().catch()`) para código assíncrono, visando melhor legibilidade.
- Sempre trate rejeições de Promises (com `catch` em Promises ou `try...catch` com `await`).

## HTML

### Estrutura e Semântica

- Use HTML5 semântico: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<aside>`, etc.
- Use a doctype HTML5: `<!DOCTYPE html>`.
- Organize o documento de forma lógica, com cabeçalhos (`<h1>` a `<h6>`) corretamente aninhados.
- Inclua o atributo `lang="pt-BR"` no elemento `<html>`.

### Práticas Recomendadas para HTML

- Use IDs para elementos únicos que precisam ser referenciados por JavaScript ou por fragmentos de URL.
- Prefira classes para estilização CSS e para selecionar múltiplos elementos em JavaScript.
- Utilize atributos `data-*` para armazenar informações específicas para JavaScript, se necessário.

### Acessibilidade (A11y)

- Inclua textos alternativos (`alt`) descritivos para todas as imagens (`<img>`) que transmitem conteúdo. Para imagens puramente decorativas, use `alt=""`.
- Use elementos semânticos e atributos ARIA (Accessible Rich Internet Applications) quando necessário para melhorar a experiência de usuários de tecnologias assistivas.

  ```html
  <button aria-label="Fechar diálogo" aria-pressed="false">X</button>
  <nav aria-label="Navegação principal">...</nav>
  <input type="checkbox" id="terms" aria-labelledby="terms-label">
  <label id="terms-label" for="terms">Aceito os termos</label>
  ```

  (Nota: `aria-pressed` é para botões de toggle. Um botão de fechar simples geralmente não precisa dele.)
- Garanta que todos os controles de formulário (`<input>`, `<select>`, `<textarea>`, `<button>`) tenham rótulos (`<label>`) associados corretamente usando o atributo `for`.
- Garanta uma ordem de foco lógica e navegabilidade por teclado.

## CSS

### Organização e Estrutura

- Organize o CSS em arquivos separados por escopo (ex: `style.css` para global, `admin.css` para admin, `faculdade-theme.css` para temas).
- Use seletores de classe como padrão. Evite seletores de ID para estilização (reserve IDs para JavaScript hooks ou âncoras). Evite estilizar tags HTML diretamente de forma muito genérica, a menos que seja para resets ou estilos base muito fundamentais.
- Prefira classes específicas e bem nomeadas a seletores aninhados profundamente para evitar alta especificidade e melhorar a performance.

### Convenções

- Use **kebab-case** para nomes de classes CSS (ex: `.nav-item`, `.sidebar-header`).
- Organize as propriedades CSS dentro de uma regra de forma consistente (ex: posicionamento, box model, tipografia, visual, outros).
- Utilize **variáveis CSS (`--var-name`)** extensivamente para cores, espaçamentos, fontes, etc., para facilitar a tematização e manutenção.

  ```css
  :root { /* ou :root.theme-name para temas */
    --primary-color: #0F6435; /* Exemplo do tema Faculdade */
    --spacing-md: 16px;
    --font-family: 'Inter', sans-serif;
  }
  .button-primary {
    background-color: var(--primary-color);
  }
  ```

### Responsividade

- Use media queries para design responsivo.
- Considere a abordagem mobile-first quando apropriado.
- Use unidades relativas (rem, em, %, vw, vh) para tipografia e layout sempre que possível, para melhor escalabilidade.

## Documentação do Código

### Comentários

- Use comentários para explicar o "porquê" de uma lógica complexa ou não óbvia, não o "o quê" ou "como" se o código já for claro.
- Use blocos de comentários JSDoc para documentar funções, classes e módulos.

### JSDoc

- Documente todas as funções públicas, classes e módulos.
- Para funções, documente todos os parâmetros (`@param`), o valor de retorno (`@returns`), e quaisquer exceções que possam ser lançadas (`@throws`).

  ```javascript
  /**
   * @module tournamentModel
   * @description Funções para interagir com a tabela de torneios no banco de dados.
   */

  /**
   * Cria um novo torneio no banco de dados.
   * @async
   * @function createTournament
   * @param {object} tournament - Dados do torneio.
   * @param {string} tournament.id - ID único do torneio.
   * @param {string} tournament.name - Nome do torneio.
   * @param {string} tournament.date - Data do torneio.
   * @param {string} [tournament.description] - Descrição opcional.
   * @param {number} [tournament.num_players_expected] - Número esperado de jogadores.
   * @param {string} [tournament.bracket_type='single-elimination'] - Tipo de chaveamento.
   * @param {string} [tournament.status='Pendente'] - Status inicial.
   * @param {string} [tournament.state_json] - String JSON do estado inicial do chaveamento.
   * @returns {Promise<object>} O objeto do torneio criado, conforme retornado pelo banco.
   * @throws {Error} Se dados essenciais estiverem faltando ou ocorrer um erro no banco.
   */
  async function createTournament(tournament) { /* ... */ }
  ```

## Testes

### Organização

- Organize os arquivos de teste em uma estrutura paralela ao código fonte, por exemplo, dentro de uma pasta `tests/` com subdiretórios como `unit/` e `integration/`.

  ```
  /lib/models/tournamentModel.js
  /tests/unit/tournamentModel.test.js
  ```

- Agrupe testes logicamente por funcionalidade ou módulo.
- Mantenha os testes independentes uns dos outros para que possam ser executados em qualquer ordem e não afetem o resultado de outros testes.

### Práticas

- Escreva testes claros e descritivos, usando `describe` e `it` (ou `test`).
- Siga o padrão Arrange-Act-Assert (AAA).
- Teste casos de sucesso, casos de borda e casos de falha.
- Use mocks ou stubs para dependências externas (ex: chamadas de API, acesso direto ao banco de dados em testes unitários de lógica de negócio).

## Controle de Versão (Git)

### Commits

- Escreva mensagens de commit claras, concisas e descritivas.
- Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/) para padronizar as mensagens:
  - `feat:` (nova funcionalidade)
  - `fix:` (correção de bug)
  - `docs:` (alterações na documentação)
  - `style:` (formatação, ponto e vírgula faltando, etc.; sem mudança de código)
  - `refactor:` (refatoração de código que não corrige bug nem adiciona feature)
  - `test:` (adição ou correção de testes)
  - `chore:` (atualização de tarefas de build, configuração de pacotes, etc.)
  - Exemplo: `feat: adiciona funcionalidade de lixeira para torneios`
- Faça commits pequenos e atômicos, focados em uma única mudança lógica.

### Branches

- Use branches para desenvolver novas funcionalidades ou corrigir bugs (`feature/nome-da-feature`, `fix/problema-corrigido`).
- Mantenha a branch principal (`main` ou `master`) sempre estável e representando o código de produção ou pronto para produção.
- Faça merge de branches de feature na branch principal através de Pull Requests (ou Merge Requests).

### Pull Requests (PRs)

- Mantenha PRs pequenos e focados.
- Inclua descrições detalhadas nos PRs, explicando o quê e o porquê das mudanças.
- Se o PR resolve uma issue, referencie-a.
- Garanta que todos os testes passem e o lint esteja limpo antes de solicitar a revisão.
- Responda a todos os comentários de revisão e discuta as sugestões.
- Obtenha aprovação de pelo menos um outro membro da equipe (se aplicável) antes de fazer o merge.

## Conformidade e Aplicação

Estas diretrizes são reforçadas através de:

1. Configurações do ESLint e Prettier no projeto.
2. Hooks de pré-commit (ex: usando Husky e lint-staged) para verificar formatação e lint antes de cada commit.
3. Revisões de código (Code Reviews) em Pull Requests.

Para aplicar as formatações e verificações manualmente:

```bash
npm run format  # Formata o código com Prettier
npm run lint    # Verifica problemas com ESLint
npm run lint:fix # Tenta corrigir problemas automaticamente
```

---

Estas diretrizes são um documento vivo e podem ser atualizadas conforme o projeto evolui. Sugestões para melhorias são bem-vindas.
