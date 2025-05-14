# Guia de Resolução de Problemas - LASCMMG

Este guia foi criado para ajudar a solucionar problemas comuns que podem surgir durante a instalação, configuração e implantação do Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG).

## Índice

1. [Problemas de Instalação](#problemas-de-instalação)
2. [Problemas de Configuração](#problemas-de-configuração)
3. [Problemas do Banco de Dados (SQLite)](#problemas-do-banco-de-dados-sqlite)
4. [Problemas de Interface](#problemas-de-interface)
5. [Problemas de Performance](#problemas-de-performance)
6. [Problemas de Implantação](#problemas-de-implantação)
7. [Contato de Suporte](#contato-de-suporte)

## Problemas de Instalação

### Erro: "Cannot find module X"

**Problema**: Durante a instalação ou execução, você encontra erros como `Cannot find module 'express'` ou outros módulos.

**Solução**:

1. Execute `npm install` novamente para garantir que todas as dependências sejam instaladas.
2. Verifique se o seu Node.js está atualizado (v14.x ou superior é recomendado).
3. Limpe o cache do npm: `npm cache clean --force`.
4. Remova a pasta `node_modules` e o arquivo `package-lock.json`, depois reinstale: `rm -rf node_modules package-lock.json && npm install`.

### Erro durante a execução do npm install

**Problema**: O comando `npm install` falha com erros de dependência ou incompatibilidade.

**Solução**:

1. Verifique se sua versão do Node.js e npm são compatíveis com as especificadas no `README.md` ou `package.json`.
2. Se estiver usando Windows, pode ser necessário instalar as ferramentas de compilação: `npm install --global windows-build-tools`.
3. Tente excluir `package-lock.json` e a pasta `node_modules` e rodar `npm install` novamente.

## Problemas de Configuração

### Erro ao carregar variáveis de ambiente

**Problema**: O sistema não reconhece variáveis de ambiente definidas no arquivo `.env`.

**Solução**:

1. Verifique se você copiou o arquivo `.env.example` para `.env` na raiz do projeto.
2. Garanta que o arquivo `.env` está formatado corretamente (CHAVE=VALOR, sem espaços extras, sem aspas a menos que o valor contenha espaços).
3. Reinicie o servidor após modificar o arquivo `.env`.
4. Verifique se o pacote `dotenv` está sendo carregado corretamente no início do `server.js` (se utilizado explicitamente, ou se o framework/scripts o fazem).

### Erro de CORS no frontend

**Problema**: Solicitações AJAX do frontend para o backend são bloqueadas por políticas de CORS.

**Solução**:

1. Verifique a configuração de CORS no arquivo `server.js`.
2. Em produção, certifique-se de que a variável de ambiente `CORS_ORIGIN` no seu arquivo `.env` esteja configurada para o domínio correto do seu frontend.
3. Durante o desenvolvimento, `CORS_ORIGIN` pode ser `*` ou o endereço do seu servidor de desenvolvimento frontend (ex: `http://localhost:8080`).

## Problemas do Banco de Dados (SQLite)

### Erro de conexão ou criação de tabelas SQLite

**Problema**: O sistema não consegue conectar-se ao banco de dados SQLite ou as tabelas não são criadas.

**Solução**:

1. Verifique se a pasta `data/` (ou o caminho definido em `DB_PATH` no `.env`) existe na raiz do projeto e se a aplicação tem permissões de escrita nela.
2. O arquivo do banco de dados (ex: `data/lascmmg.sqlite`) e suas tabelas devem ser criados automaticamente na primeira inicialização do servidor através de `lib/db-init.js` e `lib/schema.js`.
3. Verifique os logs do servidor para mensagens de erro relacionadas à inicialização do banco de dados ou migrações de esquema.
4. Se necessário, você pode tentar remover o arquivo `.sqlite` existente (faça backup antes se contiver dados importantes) e reiniciar o servidor para forçar a recriação do esquema.

### Erro durante a migração de dados JSON antigos para SQLite (se aplicável)

**Problema**: Se você está migrando de uma versão anterior que usava arquivos JSON e o script `scripts/migrate-to-sqlite.js` (ou a função `migrateDataFromJson` em `lib/db-init.js`) falha.

**Solução**:

1. Certifique-se de que os arquivos JSON antigos (`tournaments_list.json` e os JSONs dentro da antiga pasta `tournaments/`) estão íntegros e no formato esperado pela função de migração.
2. Execute o script com a opção `--verbose` (se disponível) para mais detalhes.
3. Verifique os logs de erro para identificar qual arquivo ou dado específico está causando o problema.
4. Considere migrar um torneio de cada vez (se o script permitir) para isolar o problema.

### Dados não aparecem na interface após a migração ou operações

**Problema**: Dados foram inseridos/migrados para o SQLite, mas não são exibidos corretamente na interface.

**Solução**:

1. Verifique se há erros no console do navegador (F12 > Console) e nos logs do servidor.
2. Use uma ferramenta como "DB Browser for SQLite" para inspecionar diretamente o conteúdo do arquivo `data/lascmmg.sqlite` e confirmar se os dados estão lá e corretos.
3. Verifique se as rotas da API (`routes/tournaments-sqlite.js`) estão buscando e retornando os dados corretamente do banco.
4. Confirme se o frontend (`js/apiService.js` e os handlers relevantes) está fazendo as chamadas corretas à API e processando as respostas adequadamente.

## Problemas de Interface

### Elementos de UI não aparecem corretamente

**Problema**: Componentes da interface, como botões ou formulários, não são exibidos como esperado.

**Solução**:

1. Limpe o cache do navegador (Ctrl+F5 ou Cmd+Shift+R).
2. Verifique se há erros no console do navegador (F12 > Console).
3. Teste em diferentes navegadores para identificar se é um problema específico.
4. Verifique se todos os arquivos CSS, incluindo os de tema (`faculdade-theme.css`, `faculdade-escuro-theme.css`), estão sendo carregados corretamente na aba "Network" das ferramentas de desenvolvedor.

### Problemas com os temas "Faculdade Claro" / "Faculdade Escuro"

**Problema**: O alternador de tema não funciona ou o tema não é aplicado corretamente.

**Solução**:

1. Verifique se o `localStorage` está habilitado e funcionando no seu navegador.
2. Tente limpar o `localStorage` do site (pode ser feito pelo console do navegador com `localStorage.removeItem('lascmmg-theme-preference');` e recarregando a página).
3. Confirme se os arquivos `css/faculdade-theme.css` e `css/faculdade-escuro-theme.css` estão sendo carregados.
4. Inspecione o elemento `<html>` para ver se as classes `faculdade-theme` ou `faculdade-escuro-theme` estão sendo aplicadas corretamente pelo `js/ui/theme/themeSwitcher.js`.

### Problemas de responsividade em dispositivos móveis

**Problema**: A interface não se adapta bem a dispositivos móveis.

**Solução**:

1. Verifique se a meta tag viewport está correta no HTML: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
2. Use as ferramentas de desenvolvedor do navegador para simular diferentes tamanhos de tela.
3. Inspecione as media queries no CSS para garantir que estão sendo aplicadas como esperado.
4. Procure por elementos com largura fixa ou overflow que possam estar quebrando o layout.

## Problemas de Performance

### Carregamento lento da interface

**Problema**: A interface demora para carregar ou responder.

**Solução**:

1. Use a aba "Network" e "Performance" das ferramentas de desenvolvedor do navegador para analisar o tempo de carregamento.
2. Verifique se há muitas requisições HTTP ou recursos (imagens, JS, CSS) muito grandes.
3. Considere otimizar imagens e minificar arquivos CSS e JS para produção.

### Servidor responde lentamente

**Problema**: As requisições para o servidor demoram muito para serem processadas.

**Solução**:

1. Verifique os logs do servidor para identificar gargalos ou erros frequentes.
2. Monitore o uso de CPU e memória do processo do servidor.
3. Otimize consultas ao banco de dados SQLite, garantindo que índices apropriados existam para colunas usadas em filtros e ordenações (veja `lib/schema.js`).
4. Considere habilitar o modo WAL para o SQLite para melhor concorrência, se apropriado para sua carga de trabalho.

## Problemas de Implantação

(Consulte `DEPLOYMENT.MD` para guias detalhados de implantação)

### Erro ao implantar com Docker

**Problema**: A imagem Docker não constrói ou o contêiner não inicia.

**Solução**:

1. Verifique se o Docker está instalado e o daemon está rodando.
2. Examine os logs do Docker (`docker build ...` ou `docker-compose logs <service_name>`).
3. Certifique-se de que todas as variáveis de ambiente necessárias estão configuradas no ambiente Docker.
4. Verifique se as portas estão corretamente expostas e mapeadas.
5. Garanta que os volumes para persistência de dados (como a pasta `data/` para o SQLite) estejam configurados corretamente e com as permissões adequadas.

### Problemas de proxy reverso com Nginx

**Problema**: Nginx não encaminha corretamente as requisições para a aplicação Node.js.

**Solução**:

1. Verifique a configuração do Nginx (geralmente em `/etc/nginx/sites-available/` ou `conf.d/`).
2. Confirme se o `proxy_pass` está apontando para o endereço e porta corretos onde a aplicação Node.js está rodando.
3. Examine os logs de erro do Nginx (ex: `/var/log/nginx/error.log`).

## Contato de Suporte

Se você encontrou um problema que não está listado neste guia:

1. Verifique as Issues no repositório GitHub do projeto (se aplicável) para ver se já foi reportado.
2. Se for um novo problema, considere criar uma nova issue descrevendo detalhadamente.
3. Inclua informações sobre seu ambiente (sistema operacional, versão do Node.js, navegador, etc.).
4. Forneça passos claros para reproduzir o problema.

---

Esperamos que este guia ajude a resolver os problemas que você possa encontrar!
