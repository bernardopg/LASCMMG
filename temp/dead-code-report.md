# Relatório de Análise de Código Morto

Data: 14/05/2025, 13:45:44

## Resumo

- Total de arquivos analisados: 17
- Arquivos com problemas: 9
- Total de problemas encontrados: 39
- Problemas corrigidos automaticamente: 39

## Problemas Encontrados

### Arquivos Potencialmente Mortos

- `scripts/backup-database.js` - Arquivo não importado em nenhum outro lugar
- `scripts/detect-dead-code.js` - Arquivo não importado em nenhum outro lugar
- `scripts/generate_admin_hash.js` - Arquivo não importado em nenhum outro lugar
- `scripts/initialize_admin.js` - Arquivo não importado em nenhum outro lugar
- `scripts/migrate-to-sqlite.js` - Arquivo não importado em nenhum outro lugar
- `scripts/run-all-tests.js` - Arquivo não importado em nenhum outro lugar
- `scripts/setup-admin-sqlite.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-advanced-features.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-autenticado.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-avancado.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-direto.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-import-players.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-lifecycle.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-sql-direto.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-system.js` - Arquivo não importado em nenhum outro lugar
- `scripts/test-torneios.js` - Arquivo não importado em nenhum outro lugar
- `scripts/update-dependencies.js` - Arquivo não importado em nenhum outro lugar

### Imports Não Utilizados

- Em `scripts/detect-dead-code.js`:
  - `x` não é importado em nenhum lugar
  - `y` não é importado em nenhum lugar
  - `z` não é importado em nenhum lugar
  - `y` não é importado em nenhum lugar

### Funções Não Utilizadas

- Em `scripts/test-autenticado.js`:
  - `getTournamentPlayers` (linha 171, confiança: 85%)
- Em `scripts/test-direto.js`:
  - `executeCurl` (linha 40, confiança: 85%)
- Em `scripts/test-torneios.js`:
  - `getTournamentPlayers` (linha 165, confiança: 85%)

### Variáveis Não Utilizadas

- Em `scripts/test-advanced-features.js`:
  - `fs` (linha 2, confiança: 95%)
  - `path` (linha 3, confiança: 95%)
  - `response` (linha 235, confiança: 95%)
  - `existingTournaments` (linha 271, confiança: 95%)
  - `response` (linha 292, confiança: 95%)
  - `players` (linha 374, confiança: 95%)
- Em `scripts/test-autenticado.js`:
  - `path` (linha 12, confiança: 95%)
  - `authToken` (linha 24, confiança: 95%)
  - `cookies` (linha 26, confiança: 95%)
  - `error` (linha 36, confiança: 95%)
  - `loginResult` (linha 62, confiança: 95%)
  - `getTournamentPlayers` (linha 171, confiança: 95%)
- Em `scripts/test-avancado.js`:
  - `error` (linha 28, confiança: 95%)
- Em `scripts/test-direto.js`:
  - `path` (linha 11, confiança: 95%)
  - `fs` (linha 12, confiança: 95%)
  - `API_URL` (linha 22, confiança: 95%)
  - `error` (linha 32, confiança: 95%)
  - `executeCurl` (linha 40, confiança: 95%)
- Em `scripts/test-import-players.js`:
  - `importedPlayers` (linha 280, confiança: 95%)
  - `updatedPlayers` (linha 306, confiança: 95%)
  - `response` (linha 311, confiança: 95%)
- Em `scripts/test-lifecycle.js`:
  - `path` (linha 15, confiança: 95%)
  - `fs` (linha 16, confiança: 95%)
  - `API_URL` (linha 26, confiança: 95%)
  - `error` (linha 37, confiança: 95%)
  - `players` (linha 450, confiança: 95%)
- Em `scripts/test-sql-direto.js`:
  - `path` (linha 11, confiança: 95%)
  - `fs` (linha 12, confiança: 95%)
  - `API_URL` (linha 22, confiança: 95%)
  - `error` (linha 33, confiança: 95%)
- Em `scripts/test-system.js`:
  - `fs` (linha 2, confiança: 95%)
  - `path` (linha 3, confiança: 95%)
- Em `scripts/test-torneios.js`:
  - `path` (linha 12, confiança: 95%)
  - `fs` (linha 13, confiança: 95%)
  - `error` (linha 29, confiança: 95%)
  - `getTournamentPlayers` (linha 165, confiança: 95%)


## Recomendações

1. Revise cada problema manualmente antes de removê-lo
2. Algumas funções podem ser utilizadas indiretamente (eventos, callbacks)
3. Execute testes após remover código para garantir que tudo continue funcionando
