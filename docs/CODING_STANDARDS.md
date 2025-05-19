# Padrões de Codificação - LASCMMG (Versão React)

[⬅ Voltar ao README](README.md)

## Índice

- [Princípios Gerais](#1-princípios-gerais)
- [Formatação do Código](#2-formatação-do-código)
- [Convenções de Nomenclatura](#3-convenções-de-nomenclatura)
- [JavaScript & TypeScript (Backend e Frontend React)](#4-javascript--typescript-backend-e-frontend-react)
- [JSX (Frontend React)](#5-jsx-frontend-react)
- [Estilização (Tailwind CSS & CSS)](#6-estilização-tailwind-css--css)
- [Documentação do Código](#7-documentação-do-código)
- [Testes](#8-testes)
- [Controle de Versão (Git)](#9-controle-de-versão-git)
- [Conformidade e Aplicação](#10-conformidade-e-aplicação)

---

## ✍️ Diretrizes para um Código Consistente, Legível e de Alta Qualidade

Este documento estabelece os padrões de codificação e práticas recomendadas para todos os colaboradores do projeto LASCMMG. Com a migração do frontend para **React com Tailwind CSS**, estas diretrizes foram atualizadas para refletir as melhores práticas no novo ecossistema. Seguir estas diretrizes é fundamental para manter a consistência, legibilidade, manutenibilidade e qualidade do código.

Nosso objetivo é criar um código que seja fácil de entender, modificar e expandir, promovendo a colaboração eficiente.

## 1. Princípios Gerais

* **Clareza é Prioridade:** Escreva código que seja fácil de ler e entender. Seções complexas devem ser explicadas com comentários ou documentação.
* **Consistência:** Mantenha um estilo consistente em todo o projeto.
* **Simplicidade (KISS):** Prefira soluções simples e diretas.
* **DRY (Don't Repeat Yourself):** Evite duplicação de código. Refatore lógicas comuns em funções, hooks customizados ou componentes reutilizáveis.
* **Responsabilidade Única (SRP):** Módulos, componentes, classes e funções devem ter uma única responsabilidade bem definida.

## 2. Formatação do Código

A formatação é automatizada para garantir consistência.

### Geral

* Utilize **2 espaços** para indentação.
* Mantenha as linhas com no máximo **80-100 caracteres** (ajustável via Prettier config).
* Evite linhas em branco desnecessárias.
* Certifique-se de que todos os arquivos terminem com uma nova linha.
* Use codificação **UTF-8 sem BOM**.

### Automação de Formatação e Linting

* **Prettier:** Garante a formatação consistente. Configuração em `.prettierrc.json` na raiz do projeto.
* **ESLint:** Analisa o código JavaScript/TypeScript.
    * Backend: Configuração em `eslint.config.mjs` (raiz do projeto).
    * Frontend (React): Configuração em `frontend-react/eslint.config.js` e integrado com `react-scripts` (ver `frontend-react/package.json`).

**Comandos Úteis (execute na raiz do projeto para backend, e em `frontend-react/` para frontend):**

```bash
# Na raiz do projeto (para backend e formatação geral)
npm run format
npm run lint
npm run lint:fix

# No diretório frontend-react/ (para frontend)
npm run lint
# (react-scripts geralmente integra linting no start/build)
# Para formatação, o Prettier da raiz deve cobrir.
```

**Recomendação:** Configure seu editor para rodar Prettier e ESLint automaticamente ao salvar.

## 3. Convenções de Nomenclatura

Nomes devem ser descritivos e refletir a intenção.

### Arquivos e Diretórios

* **Componentes React:** Use **PascalCase** (ex: `PlayerCard.jsx`, `TournamentList.jsx`).
* **Hooks React:** Use prefixo `use` e **camelCase** (ex: `useAuth.js`, `useFormValidation.js`).
* **Arquivos JavaScript/TypeScript (não componentes/hooks):** Use **camelCase** (ex: `apiService.js`, `dateUtils.ts`).
* **Arquivos de Estilo (se não usar Tailwind exclusivamente):** Use **kebab-case** (ex: `global-styles.css`).
* **Diretórios:** Use **camelCase** ou **kebab-case** de forma consistente dentro de `src/` (ex: `components`, `utils`, `api-services`).

### Código

* **Variáveis e Funções:** Use **camelCase** (ex: `playerName`, `calculateScore`).
* **Componentes React (Função ou Classe) e Classes:** Use **PascalCase** (ex: `TournamentDashboard`, `class UserSession`).
* **Constantes Globais/Módulo:** Use **UPPER_SNAKE_CASE** (ex: `MAX_PLAYERS`, `API_BASE_URL`).
* **Variáveis Booleanas:** Use prefixos como `is`, `has`, `can` (ex: `isActive`, `hasPermission`).
* **Tipos e Interfaces (TypeScript):** Use **PascalCase** (ex: `interface UserProfile`, `type AdminPermissions`).
* Evite abreviações excessivas.

## 4. JavaScript & TypeScript (Backend e Frontend React)

### Estrutura e Padrões

* Utilize **ES6+ (ECMAScript 2015 e superior)**. TypeScript é preferível para novas funcionalidades, especialmente no backend, para melhor tipagem e manutenibilidade.
* **Módulos:**
    * Backend (`backend/`): Preferencialmente **ESM (`import`/`export`)** para novos módulos. Código existente pode usar CommonJS.
    * Frontend (`frontend-react/src/`): Exclusivamente **ESM (`import`/`export`)**.
* **React (Frontend):**
    * Prefira **Componentes Funcionais com Hooks** em vez de Componentes de Classe.
    * Siga as **Regras dos Hooks** (chamar apenas no nível superior, chamar apenas de componentes React ou custom hooks).
    * Utilize **Context API** para gerenciamento de estado global (ex: `AuthContext`, `ThemeContext`). Para estados mais complexos, considerar bibliotecas como Zustand ou Redux Toolkit se necessário.
    * Componentes devem ser pequenos e focados em uma única responsabilidade.
    * Use **PropTypes** (ou TypeScript para tipagem de props) para validar props de componentes.
* **TypeScript (Opcional, mas recomendado para novas partes):**
    * Use tipos explícitos para parâmetros de função, valores de retorno e variáveis complexas.
    * Utilize interfaces (`interface`) ou tipos (`type`) para definir formas de objetos.
    * Evite o tipo `any` sempre que possível.

### Práticas Recomendadas

* **Imutabilidade:** Especialmente no React, trate o estado e as props como imutáveis. Use o operador spread (`...`) ou bibliotecas como Immer para atualizações de estado.
* **Destructuring:** Para acessar propriedades de objetos e elementos de arrays.
* **Parâmetros Padrão:** Para argumentos de função.
* **Operadores Spread/Rest (`...`):** Para expandir/coletar iteráveis.
* **Métodos Funcionais de Array:** (`map`, `filter`, `reduce`, etc.) são preferidos para clareza e imutabilidade.
* **Encadeamento Opcional (`?.`) e Coalescência Nula (`??`):** Para manipulação segura de valores nulos/undefined.
* **Igualdade Estrita (`===`, `!==`):** Sempre.
* **Async/Await:** Para código assíncrono, com tratamento de erro `try...catch`.
* **Tratamento de Erros:**
    * Use `try...catch` e reporte erros para o sistema de logging (Pino no backend) ou para o usuário (frontend).
    * No frontend, use Error Boundaries para capturar erros em partes da UI.

## 5. JSX (Frontend React)

* **Semântica HTML:** Use elementos HTML semânticos dentro do JSX.
* **Atributos:** Atributos HTML como `class` tornam-se `className` em JSX. Atributos `data-*` são permitidos.
* **Chaves (`key`):** Sempre forneça uma prop `key` única e estável ao renderizar listas de elementos.
* **Acessibilidade (A11y):**
    * Use `alt` descritivo para imagens.
    * Associe `label`s a controles de formulário usando `htmlFor`.
    * Utilize atributos ARIA quando necessário para melhorar a semântica de componentes customizados.
    * Garanta navegação por teclado e foco visível.

## 6. Estilização (Tailwind CSS & CSS)

* **Tailwind CSS é a principal abordagem para estilização no frontend React.**
    * Utilize classes de utilidade do Tailwind diretamente no JSX.
    * Configure o `tailwind.config.js` para customizações de tema (cores, fontes, espaçamentos).
* **CSS Global e Variáveis:**
    * Estilos globais mínimos e definições de variáveis CSS (especialmente para temas) devem residir em `frontend-react/src/index.css`.
    * As cores primárias, secundárias, de feedback (sucesso, erro, aviso) e de tema (fundo, texto) são definidas como variáveis CSS e usadas pelo Tailwind.
* **CSS Modules ou Styled Components (Opcional):** Para componentes muito complexos onde Tailwind pode se tornar verboso, CSS Modules (`.module.css`) ou Styled Components podem ser considerados, mas Tailwind é a preferência.
* **Evite CSS inline** exceto para estilos dinâmicos que não podem ser facilmente tratados por classes.
* **Responsividade:** Utilize os prefixos responsivos do Tailwind (ex: `md:`, `lg:`) para design adaptativo.

## 7. Documentação do Código

### Comentários

* Explique o "porquê" de lógicas complexas, não o "o quê".
* Use comentários `// TODO:` ou `// FIXME:` para indicar trabalho pendente ou problemas.

### JSDoc / TSDoc

* Documente funções públicas, componentes React, hooks customizados, classes e módulos.
* Para componentes React, documente suas `props`.
* Para funções/hooks:
    * Descrição da finalidade.
    * `@param` para cada parâmetro.
    * `@returns` para o valor de retorno.
    * `@throws` se aplicável.

    ```javascript
    /**
     * Hook customizado para gerenciar o estado de um formulário.
     * @param {object} initialValues - Valores iniciais do formulário.
     * @returns {{ values: object, handleChange: function, handleSubmit: function }}
     */
    function useForm(initialValues) { /* ... */ }
    ```

## 8. Testes

* **Backend:** [Vitest](https://vitest.dev/) para testes unitários e de integração. Arquivos em `backend/tests/`. Nomenclatura: `*.test.js` ou `*.spec.js`.
* **Frontend (React):** [Jest](https://jestjs.io/) e [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (via `react-scripts`). Arquivos de teste próximos aos componentes (ex: `src/components/MyComponent.test.jsx`).
* **Práticas:**
    * Siga o padrão Arrange-Act-Assert (AAA).
    * Teste casos de sucesso, borda e falha.
    * Priorize testar o comportamento do ponto de vista do usuário.
    * Mantenha alta cobertura de testes para lógica crítica.

## 9. Controle de Versão (Git)

* **Commits:**
    * Mensagens claras, seguindo [Conventional Commits](https://www.conventionalcommits.org/).
    * Commits pequenos e atômicos.
* **Branches:**
    * `main` (ou `master`) é a branch estável.
    * Desenvolvimento em feature branches (ex: `feature/nome-da-feature`, `fix/bug-corrigido`).
* **Pull Requests (PRs):**
    * Descrições detalhadas.
    * Revisão de código por pelo menos um outro membro da equipe.
    * Garanta que testes e linters passem antes do merge.

## 10. Conformidade e Aplicação

* **Ferramentas Automatizadas:** ESLint e Prettier são configurados para reforçar padrões.
* **Revisões de Código:** Essenciais para manter a qualidade e conformidade.
* **CI/CD:** Pipelines de Integração Contínua devem rodar linters e testes automaticamente.

---

Seguindo estes padrões, contribuímos para um projeto LASCMMG mais robusto, manutenível e colaborativo.
