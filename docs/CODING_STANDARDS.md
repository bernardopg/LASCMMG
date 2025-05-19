# Padrões de Codificação - LASCMMG (Versão React com Vite)

[⬅ Voltar ao README Principal](README.md)

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

Este documento estabelece os padrões de codificação e práticas recomendadas para todos os colaboradores do projeto LASCMMG. Com a modernização do frontend para **React com Vite e Tailwind CSS**, estas diretrizes foram atualizadas para refletir as melhores práticas no novo ecossistema. Seguir estas diretrizes é fundamental para manter a consistência, legibilidade, manutenibilidade e qualidade do código.

Nosso objetivo é criar um código que seja fácil de entender, modificar e expandir, promovendo a colaboração eficiente.

## 1. Princípios Gerais

- **Clareza é Prioridade:** Escreva código que seja fácil de ler e entender. Seções complexas devem ser explicadas com comentários ou documentação.
- **Consistência:** Mantenha um estilo consistente em todo o projeto.
- **Simplicidade (KISS):** Prefira soluções simples e diretas.
- **DRY (Don't Repeat Yourself):** Evite duplicação de código. Refatore lógicas comuns em funções, hooks customizados ou componentes reutilizáveis.
- **Responsabilidade Única (SRP):** Módulos, componentes, classes e funções devem ter uma única responsabilidade bem definida.

## 2. Formatação do Código

A formatação é automatizada para garantir consistência.

### Geral

- Utilize **2 espaços** para indentação.
- Mantenha as linhas com no máximo **80-100 caracteres** (ajustável via Prettier config).
- Evite linhas em branco desnecessárias.
- Certifique-se de que todos os arquivos terminem com uma nova linha.
- Use codificação **UTF-8 sem BOM**.

### Automação de Formatação e Linting

- **Prettier:** Garante a formatação consistente. Configuração em `.prettierrc.json` na raiz do projeto.
- **ESLint:** Analisa o código JavaScript/TypeScript.
  - Backend: Configuração em `eslint.config.mjs` (raiz do projeto).
  - Frontend (React com Vite): Configuração em `frontend-react/eslint.config.js` (ou `frontend-react/.eslintrc.cjs` dependendo da configuração do Vite).

**Comandos Úteis:**

```bash
# Na raiz do projeto (para backend e formatação geral de todo o projeto)
npm run format
npm run lint
npm run lint:fix

# No diretório frontend-react/ (para linting específico do frontend)
cd frontend-react
npm run lint
npm run lint:fix # Se configurado no package.json do frontend
cd ..
```

**Recomendação:** Configure seu editor para rodar Prettier e ESLint automaticamente ao salvar.

## 3. Convenções de Nomenclatura

Nomes devem ser descritivos e refletir a intenção.

### Arquivos e Diretórios

- **Componentes React:** Use **PascalCase** (ex: `PlayerCard.jsx`, `TournamentList.tsx`).
- **Hooks React:** Use prefixo `use` e **camelCase** (ex: `useAuth.js`, `useFormValidation.ts`).
- **Arquivos JavaScript/TypeScript (não componentes/hooks):** Use **camelCase** (ex: `apiService.js`, `dateUtils.ts`).
- **Arquivos de Estilo (se não usar Tailwind exclusivamente):** Use **kebab-case** (ex: `global-styles.css`).
- **Diretórios:** Use **camelCase** ou **kebab-case** de forma consistente dentro de `src/` (ex: `components`, `utils`, `api-services`).

### Código

- **Variáveis e Funções:** Use **camelCase** (ex: `playerName`, `calculateScore`).
- **Componentes React (Função ou Classe) e Classes:** Use **PascalCase** (ex: `TournamentDashboard`, `class UserSession`).
- **Constantes Globais/Módulo:** Use **UPPER_SNAKE_CASE** (ex: `MAX_PLAYERS`, `API_BASE_URL`).
- **Variáveis Booleanas:** Use prefixos como `is`, `has`, `can` (ex: `isActive`, `hasPermission`).
- **Tipos e Interfaces (TypeScript):** Use **PascalCase** (ex: `interface UserProfile`, `type AdminPermissions`).
- Evite abreviações excessivas.

## 4. JavaScript & TypeScript (Backend e Frontend React)

### Estrutura e Padrões

- Utilize **ES6+ (ECMAScript 2015 e superior)**. TypeScript é preferível para novas funcionalidades, especialmente no backend e para tipagem de props no frontend, para melhor tipagem e manutenibilidade.
- **Módulos:**
  - Backend (`backend/`): Preferencialmente **ESM (`import`/`export`)** para novos módulos. Código existente pode usar CommonJS.
  - Frontend (`frontend-react/src/`): Exclusivamente **ESM (`import`/`export`)**.
- **React (Frontend):**
  - Prefira **Componentes Funcionais com Hooks** em vez de Componentes de Classe.
  - Siga as **Regras dos Hooks** (chamar apenas no nível superior, chamar apenas de componentes React ou custom hooks).
  - Utilize **Context API** para gerenciamento de estado global (ex: `AuthContext`, `ThemeContext`). Para estados mais complexos, considerar bibliotecas como Zustand ou Redux Toolkit se necessário.
  - Componentes devem ser pequenos e focados em uma única responsabilidade.
  - Use **TypeScript para tipagem de props** em componentes. PropTypes pode ser usado em projetos JavaScript puros.
- **TypeScript (Fortemente recomendado):**
  - Use tipos explícitos para parâmetros de função, valores de retorno e variáveis complexas.
  - Utilize interfaces (`interface`) ou tipos (`type`) para definir formas de objetos.
  - Evite o tipo `any` sempre que possível. Use `unknown` para maior segurança de tipo quando o tipo exato não é conhecido.

### Práticas Recomendadas

- **Imutabilidade:** Especialmente no React, trate o estado e as props como imutáveis. Use o operador spread (`...`) ou bibliotecas como Immer para atualizações de estado.
- **Destructuring:** Para acessar propriedades de objetos e elementos de arrays.
- **Parâmetros Padrão:** Para argumentos de função.
- **Operadores Spread/Rest (`...`):** Para expandir/coletar iteráveis.
- **Métodos Funcionais de Array:** (`map`, `filter`, `reduce`, etc.) são preferidos para clareza e imutabilidade.
- **Encadeamento Opcional (`?.`) e Coalescência Nula (`??`):** Para manipulação segura de valores nulos/undefined.
- **Igualdade Estrita (`===`, `!==`):** Sempre.
- **Async/Await:** Para código assíncrono, com tratamento de erro `try...catch` e blocos `finally` quando apropriado.
- **Tratamento de Erros:**
  - Use `try...catch` e reporte erros para o sistema de logging (Pino no backend) ou para o usuário de forma clara no frontend.
  - No frontend, use Error Boundaries para capturar erros em partes da UI e evitar que a aplicação inteira quebre.
- **Validação de Entrada (Backend):**
  - Utilize **Joi** para definir schemas e validar dados de entrada (corpo da requisição, parâmetros de URL, query strings) nas rotas da API. Isso garante que os dados sejam consistentes e seguros antes do processamento.
- **Interação com Redis (Backend):**
  - Ao interagir com o cliente Redis, utilize `try...catch` para lidar com possíveis erros de conexão ou comando.
  - Siga as convenções de nomenclatura de chaves (ex: prefixos como `csrf:`, `failedlogin:`).

## 5. JSX (Frontend React)

- **Semântica HTML:** Use elementos HTML semânticos dentro do JSX.
- **Atributos:** Atributos HTML como `class` tornam-se `className` em JSX. Atributos `data-*` são permitidos.
- **Chaves (`key`):** Sempre forneça uma prop `key` única e estável ao renderizar listas de elementos. Evite usar o índice do array como `key` se a ordem dos itens puder mudar.
- **Acessibilidade (A11y):**
  - Use `alt` descritivo para imagens.
  - Associe `label`s a controles de formulário usando `htmlFor` (que corresponde ao `id` do input).
  - Utilize atributos ARIA quando necessário para melhorar a semântica de componentes customizados e interações complexas.
  - Garanta navegação por teclado e foco visível e gerenciável.

## 6. Estilização (Tailwind CSS & CSS)

- **Tailwind CSS é a principal abordagem para estilização no frontend React.**
  - Utilize classes de utilidade do Tailwind diretamente no JSX.
  - Configure o `tailwind.config.js` para customizações de tema (cores, fontes, espaçamentos, plugins).
- **CSS Global e Variáveis:**
  - Estilos globais mínimos e definições de variáveis CSS (especialmente para temas) devem residir em `frontend-react/src/index.css` (ou um arquivo CSS global importado no `main.jsx`).
  - As cores primárias, secundárias, de feedback (sucesso, erro, aviso) e de tema (fundo, texto) são definidas como variáveis CSS e/ou no tema do Tailwind.
- **CSS Modules ou Styled Components (Opcional/Exceção):** Para componentes muito complexos onde Tailwind pode se tornar excessivamente verboso ou para encapsulamento forte de estilos, CSS Modules (`.module.css`) podem ser considerados. Styled Components são uma alternativa, mas Tailwind é a preferência.
- **Evite CSS inline** exceto para estilos dinâmicos que não podem ser facilmente tratados por classes ou variáveis CSS.
- **Responsividade:** Utilize os prefixos responsivos do Tailwind (ex: `sm:`, `md:`, `lg:`) para design adaptativo.

## 7. Documentação do Código

### Comentários

- Explique o "porquê" de lógicas complexas, não apenas o "o quê".
- Use comentários `// TODO: [descrição]` ou `// FIXME: [descrição]` para indicar trabalho pendente ou problemas que precisam de atenção.

### JSDoc / TSDoc

- Documente funções públicas, componentes React, hooks customizados, classes e módulos.
- Para componentes React, documente suas `props` (especialmente se não usar TypeScript para tipagem de props).
- Para funções/hooks:

  - Descrição da finalidade.
  - `@param {tipo} nome - Descrição do parâmetro.`
  - `@returns {tipo} Descrição do valor de retorno.`
  - `@throws {ErrorTipo} Descrição da condição de erro.` (se aplicável)

  ```typescript
  /**
   * Hook customizado para gerenciar o estado de um formulário.
   * @param initialValues - Valores iniciais do formulário.
   * @returns Um objeto contendo os valores do formulário, manipulador de mudança e manipulador de submissão.
   */
  function useForm<T>(initialValues: T): {
    values: T;
    handleChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => void;
    handleSubmit: (
      onSubmit: (values: T) => void
    ) => (event: React.FormEvent) => void;
  } {
    // ... implementação ...
  }
  ```

## 8. Testes

- **Backend:** [Vitest](https://vitest.dev/) para testes unitários e de integração. Arquivos em `backend/tests/` (ou estrutura similar). Nomenclatura: `*.test.js` ou `*.spec.ts`.
- **Frontend (React):** [Vitest](https://vitest.dev/) (recomendado para projetos Vite) ou [Jest](https://jestjs.io/) com [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/). Arquivos de teste próximos aos componentes (ex: `src/components/MyComponent.test.jsx` ou `src/components/MyComponent.spec.tsx`).
- **Práticas:**
  - Siga o padrão Arrange-Act-Assert (AAA).
  - Teste casos de sucesso, casos de borda e cenários de falha.
  - Priorize testar o comportamento do ponto de vista do usuário, especialmente para componentes de UI.
  - Mantenha alta cobertura de testes para lógica de negócios crítica e utilitários.
  - Utilize mocks e spies de forma eficaz para isolar unidades de teste.

## 9. Controle de Versão (Git)

- **Commits:**
  - Mensagens claras e concisas, seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/). Ex: `feat: adiciona login com OAuth`, `fix: corrige bug na paginação de placares`.
  - Commits pequenos e atômicos, focados em uma única mudança lógica.
- **Branches:**
  - `main` (ou `master`) é a branch estável e reflete o estado de produção.
  - Desenvolvimento em feature branches (ex: `feature/nome-da-feature`, `fix/bug-corrigido`, `refactor/melhoria-auth`).
  - Branches devem ser criadas a partir da branch de desenvolvimento principal (ex: `develop`, ou `main` se for o caso).
- **Pull Requests (PRs) / Merge Requests (MRs):**
  - Descrições detalhadas do propósito da PR, mudanças realizadas e como testar.
  - Link para issues relevantes, se houver.
  - Revisão de código por pelo menos um outro membro da equipe é obrigatória antes do merge.
  - Garanta que todos os testes automatizados e linters passem na pipeline de CI antes do merge.
- **Tags:** Use tags versionadas (ex: `v1.0.0`, `v1.1.0-beta.1`) para marcar releases.

## 10. Conformidade e Aplicação

- **Ferramentas Automatizadas:** ESLint e Prettier são configurados para reforçar padrões. Sua execução deve ser parte do processo de CI.
- **Revisões de Código:** Essenciais para manter a qualidade, compartilhar conhecimento e garantir a conformidade com os padrões.
- **CI/CD (Integração Contínua / Entrega Contínua):** Pipelines devem ser configuradas para rodar linters, testes, e builds automaticamente a cada push ou PR.

---

Seguindo estes padrões, contribuímos para um projeto LASCMMG mais robusto, manutenível, escalável e colaborativo.
