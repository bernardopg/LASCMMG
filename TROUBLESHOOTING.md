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
2. Verifique se o seu Node.js está atualizado (v16.x ou superior é recomendado).
3. Limpe o cache do npm: `npm cache clean --force`.
4. Remova a pasta `node_modules` e o arquivo `package-lock.json`, depois reinstale: `rm -rf node_modules package-lock.json && npm install`.

### Erro durante a execução do `npm install` (especialmente com `better-sqlite3`)

**Problema**: O comando `npm install` falha, frequentemente com erros relacionados à compilação de `better-sqlite3`.

**Solução**:

1. Verifique se sua versão do Node.js e npm são compatíveis (Node.js v16+).
2. `better-sqlite3` é um módulo nativo e pode precisar de ferramentas de compilação:
   - **Linux (Debian/Ubuntu):** `sudo apt-get install -y python3 make g++ build-essential`
   - **Windows:** Pode ser necessário instalar as ferramentas de compilação do Windows: `npm install --global --production windows-build-tools` (execute como administrador) ou instalar o Visual Studio Build Tools.
   - **macOS:** As ferramentas de linha de comando do Xcode geralmente são suficientes (`xcode-select --install`).
3. Tente excluir `package-lock.json` e a pasta `node_modules` e rodar `npm install` novamente.

## Problemas de Configuração

### Erro ao carregar variáveis de ambiente

**Problema**: O sistema não reconhece variáveis de ambiente definidas no arquivo `.env`.

**Solução**:

1. Verifique se você copiou o arquivo `.env.example` para `.env` na raiz do projeto.
2. Garanta que o arquivo `.env` está formatado corretamente (CHAVE=VALOR, sem espaços extras, sem aspas a menos que o valor contenha espaços).
3. Reinicie o servidor após modificar o arquivo `.env`.
4. Verifique se o pacote `dotenv` está sendo carregado corretamente no início do `server.js` (`require('dotenv').config();`).

### Erro de CORS no frontend

**Problema**: Solicitações AJAX do frontend para o backend são bloqueadas por políticas de CORS.

**Solução**:

1. Verifique a configuração de CORS no arquivo `server.js`.
2. Em produção, certifique-se de que a variável de ambiente `CORS_ORIGIN` no seu arquivo `.env` esteja configurada para o domínio correto do seu frontend.
3. Durante o desenvolvimento, `CORS_ORIGIN` pode ser `*` ou o endereço do seu servidor de desenvolvimento frontend (ex: `http://localhost:3000` se servindo do mesmo local).

## Problemas do Banco de Dados (SQLite)

### Erro de conexão ou criação de tabelas SQLite

**Problema**: O sistema não consegue conectar-se ao banco de dados SQLite ou as tabelas não são criadas.

**Solução**:

1. Verifique se a pasta `data/` existe na raiz do projeto e se a aplicação tem permissões de escrita nela. O arquivo do banco de dados é `data/data.db`.
2. O arquivo do banco de dados e suas tabelas devem ser criados automaticamente na primeira inicialização do servidor através de `lib/database.js` (chamado ao iniciar `server.js`) e as migrações de esquema são aplicadas por `lib/db-init.js` (também chamado em `server.js`).
3. Verifique os logs do servidor para mensagens de erro relacionadas à inicialização do banco de dados ou migrações de esquema.
4. Se necessário, você pode tentar remover o arquivo `data/data.db` (faça backup antes se contiver dados importantes) e reiniciar o servidor para forçar a recriação do esquema.

### Dados não aparecem na interface após operações

**Problema**: Dados foram inseridos/migrados para o SQLite, mas não são exibidos corretamente na interface.

**Solução**:

1. Verifique se há erros no console do navegador (F12 > Console) e nos logs do servidor.
2. Use uma ferramenta como "DB Browser for SQLite" para inspecionar diretamente o conteúdo do arquivo `data/data.db` e confirmar se os dados estão lá e corretos.
3. Verifique se as rotas da API (`routes/tournaments-sqlite.js`, etc.) estão buscando e retornando os dados corretamente do banco.
4. Confirme se o frontend (`js/apiService.js` e os handlers relevantes) está fazendo as chamadas corretas à API e processando as respostas adequadamente.

## Problemas de Interface

### Elementos de UI não aparecem corretamente

**Problema**: Componentes da interface, como botões ou formulários, não são exibidos como esperado.

**Solução**:

1. Limpe o cache do navegador (Ctrl+F5 ou Cmd+Shift+R).
2. Verifique se há erros no console do navegador (F12 > Console).
3. Teste em diferentes navegadores para identificar se é um problema específico.
4. Verifique se todos os arquivos CSS, incluindo os de tema (`faculdade-theme.css`, `verde-escuro-theme.css`), estão sendo carregados corretamente na aba "Network" das ferramentas de desenvolvedor.

### Problemas com os temas

**Problema**: O alternador de tema não funciona ou o tema não é aplicado corretamente.

**Solução**:

1. Verifique se o `localStorage` está habilitado e funcionando no seu navegador.
2. Tente limpar o `localStorage` do site (pode ser feito pelo console do navegador com `localStorage.removeItem('theme-preference');` e recarregando a página).
3. Confirme se os arquivos CSS de tema estão sendo carregados.
4. Inspecione o elemento `<html>` para ver se as classes de tema estão sendo aplicadas corretamente pelo JavaScript (ver `js/themeManager.js` e `js/themeSwitcher.js` ou `js/themeToggler.js`).

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
3. Otimize consultas ao banco de dados SQLite, garantindo que índices apropriados existam para colunas usadas em filtros e ordenações (verifique as definições de tabela em `lib/database.js`).
4. Considere habilitar o modo WAL para o SQLite para melhor concorrência (`PRAGMA journal_mode=WAL;`), se apropriado para sua carga de trabalho.

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
