# Guia de Testes de Integração Frontend-Backend

Este diretório contém uma suíte completa de testes de integração que validam a comunicação entre o frontend React e o backend Node.js do sistema LASCMMG.

## Estrutura dos Testes

```
src/tests/
├── README.md                    # Este arquivo
├── setup/
│   └── integration-setup.js     # Configuração dos testes de integração
├── mocks/
│   ├── handlers.js              # Handlers MSW para mock das APIs
│   └── server.js                # Servidor MSW configurado
└── integration/
    ├── auth.test.jsx            # Testes de autenticação
    ├── players.test.jsx         # Testes de gerenciamento de jogadores
    ├── scores.test.jsx          # Testes de gerenciamento de placares
    └── trash.test.jsx           # Testes de gerenciamento da lixeira
```

## Tecnologias Utilizadas

- **Vitest**: Framework de testes rápido e moderno
- **React Testing Library**: Utilitários para testar componentes React
- **MSW (Mock Service Worker)**: Mock das requisições HTTP
- **jsdom**: Ambiente DOM simulado para Node.js

## Configuração

### Dependências

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event @vitest/coverage-v8 jsdom msw vitest
```

### Arquivos de Configuração

- `vitest.integration.config.js`: Configuração específica para testes de integração
- `src/tests/setup/integration-setup.js`: Setup inicial para todos os testes

## Executando os Testes

### Testes de Integração

```bash
# Executar todos os testes de integração
npm run test:integration

# Executar em modo watch
npm run test:integration:watch

# Executar com cobertura
npm run test:coverage
```

### Testes Específicos

```bash
# Executar apenas testes de autenticação
npx vitest run src/tests/integration/auth.test.jsx

# Executar apenas testes de jogadores
npx vitest run src/tests/integration/players.test.jsx

# Executar apenas testes de placares
npx vitest run src/tests/integration/scores.test.jsx

# Executar apenas testes de lixeira
npx vitest run src/tests/integration/trash.test.jsx
```

### Todos os Testes

```bash
# Executar testes unitários, integração e E2E
npm run test:all
```

## Estrutura dos Testes

### Testes de Autenticação (`auth.test.jsx`)

- **Admin Login**: Validação de login de administrador
- **User Login**: Validação de login de usuário comum
- **Authentication State Management**: Gerenciamento de estado de autenticação
- **CSRF Protection**: Validação de proteção CSRF
- **Session Management**: Gerenciamento de sessão e expiração de tokens

### Testes de Jogadores (`players.test.jsx`)

- **Players List Management**: Carregamento e exibição da lista de jogadores
- **Player Creation**: Criação de novos jogadores com validação
- **Player Editing**: Edição de jogadores existentes
- **Player Deletion**: Exclusão e movimentação para lixeira
- **Public Players View**: Visualização pública sem privilégios de admin
- **Player Import**: Importação de jogadores via CSV
- **Data Persistence**: Persistência de dados após reload

### Testes de Placares (`scores.test.jsx`)

- **Scores List Management**: Gerenciamento da lista de placares
- **Score Creation**: Criação de novos placares com validação
- **Score Editing**: Edição de placares existentes
- **Score Deletion**: Exclusão de placares
- **Public Scores View**: Visualização pública de placares
- **Winner Calculation**: Cálculo automático do vencedor
- **Real-time Updates**: Atualizações em tempo real
- **Data Validation**: Validação de dados e prevenção de duplicatas

### Testes de Lixeira (`trash.test.jsx`)

- **Trash List Management**: Gerenciamento da lista de itens na lixeira
- **Item Restoration**: Restauração de itens deletados
- **Permanent Deletion**: Exclusão permanente com confirmação
- **Bulk Operations**: Operações em lote (restaurar/excluir múltiplos)
- **Empty Trash State**: Estado de lixeira vazia
- **Trash Statistics**: Estatísticas da lixeira
- **Auto-cleanup**: Aviso de limpeza automática para itens antigos

## Mock Service Worker (MSW)

O MSW é usado para interceptar e mockar as requisições HTTP durante os testes, permitindo:

- Testes isolados sem depender do backend real
- Simulação de diferentes cenários (sucesso, erro, dados específicos)
- Controle total sobre as respostas da API
- Testes determinísticos e rápidos

### Handlers Implementados

- **Autenticação**: Login admin/usuário, logout, CSRF
- **Jogadores**: CRUD completo, busca, paginação, importação
- **Placares**: CRUD completo, validação, filtros
- **Lixeira**: Listagem, restauração, exclusão permanente, operações em lote
- **Estatísticas**: Dados agregados do sistema
- **Tratamento de Erros**: Cenários de erro 401, 403, 404, 500

## Cobertura de Testes

Os testes cobrem:

- ✅ Fluxos completos de usuário (happy path)
- ✅ Validação de formulários
- ✅ Tratamento de erros de API
- ✅ Estados de carregamento
- ✅ Paginação e filtros
- ✅ Autorização e autenticação
- ✅ Operações CRUD
- ✅ Estados vazios
- ✅ Operações em lote
- ✅ Persistência de dados

## Debugging

### Logs de Debug

Para habilitar logs detalhados durante os testes:

```bash
DEBUG=msw* npm run test:integration
```

### Testando Componentes Individuais

```javascript
import { render, screen } from '@testing-library/react';
import { TestWrapper } from '../setup/test-utils';
import MyComponent from '../../components/MyComponent';

test('should render component', () => {
  render(
    <TestWrapper>
      <MyComponent />
    </TestWrapper>
  );

  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

## Boas Práticas

### Nomenclatura de Testes

- Use descrições claras e específicas
- Agrupe testes relacionados com `describe`
- Use `it` ou `test` para casos individuais

### Assertions

- Use matchers específicos do jest-dom
- Sempre aguarde operações assíncronas com `waitFor`
- Use `userEvent` para simular interações do usuário

### Setup e Cleanup

- Limpe state entre testes com `beforeEach`
- Use mocks específicos quando necessário
- Restore mocks após os testes

## Integração com CI/CD

Os testes estão configurados para execução em ambientes de CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run Integration Tests
  run: npm run test:integration

- name: Upload Coverage
  run: npm run test:coverage
```

## Troubleshooting

### Problemas Comuns

1. **Timeouts**: Aumente o timeout em `vitest.integration.config.js`
2. **Memory Leaks**: Verifique se todos os mocks são limpos
3. **Flaky Tests**: Use `waitFor` para operações assíncronas
4. **MSW Errors**: Verifique se os handlers estão configurados corretamente

### Performance

- Testes paralelos estão habilitados por padrão
- Use `--reporter=verbose` para output detalhado
- Configure `maxConcurrency` se necessário

## Contribuindo

Ao adicionar novos testes:

1. Siga a estrutura existente
2. Adicione mocks MSW necessários
3. Teste cenários de sucesso e erro
4. Documente casos de teste complexos
5. Mantenha os testes DRY (Don't Repeat Yourself)

## Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)
