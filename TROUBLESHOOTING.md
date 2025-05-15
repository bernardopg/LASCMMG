# Guia de Resolução de Problemas - LASCMMG

## 🔍 Solucionando Questões Comuns: Um Guia Prático

Este guia foi elaborado para ajudar você a diagnosticar e resolver problemas comuns que podem surgir durante a instalação, configuração, execução e implantação do Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG). Se você encontrar um obstáculo, este é o primeiro lugar para procurar uma solução.

O LASCMMG é construído com Node.js, Express e utiliza SQLite como banco de dados principal, o que simplifica muitos aspectos, mas alguns problemas específicos podem ocorrer.

## 📑 Índice

1. [Antes de Começar: Informações Essenciais](#antes-de-começar-informações-essenciais)
2. [Problemas de Instalação e Dependências](#problemas-de-instalação-e-dependências)
3. [Problemas de Configuração (`.env`)](#problemas-de-configuração-env)
4. [Problemas do Banco de Dados (SQLite)](#problemas-do-banco-de-dados-sqlite)
5. [Problemas de Inicialização do Servidor](#problemas-de-inicializacao-do-servidor)
6. [Problemas de Acesso e Autenticação](#problemas-de-acesso-e-autenticação)
7. [Problemas de Interface e Frontend](#problemas-de-interface-e-frontend)
8. [Problemas de Performance](#problemas-de-performance)
9. [Problemas de Implantação](#problemas-de-implantação)
10. [Coletando Informações para Suporte](#coletando-informações-para-suporte)

## 1. Antes de Começar: Informações Essenciais

Ao encontrar um problema, ter as seguintes informações à mão pode acelerar a resolução:

* **Versão do Node.js e npm:** Execute `node -v` e `npm -v`.
* **Sistema Operacional:** Qual SO você está usando (Windows, macOS, Linux - qual distribuição e versão)?
* **Ambiente:** O problema ocorre em desenvolvimento ou produção?
* **Logs:** Verifique os logs do servidor (console onde `npm run dev` ou `npm start` está rodando, ou logs do PM2/Systemd/Docker) e o console do navegador (F12).
* **Passos para Reproduzir:** Descreva exatamente o que você fez para que o problema ocorresse.

## 2. Problemas de Instalação e Dependências

### Erro: `Cannot find module '...'` ou `require(...)` falha

**Problema**: Após clonar o repositório e rodar `npm install`, ou ao tentar iniciar o servidor, você vê erros indicando que um módulo não foi encontrado (ex: `Cannot find module 'express'`, `Cannot find module 'better-sqlite3'`).

**Solução**:

1. **Reinstale as dependências:** Navegue até o diretório raiz do projeto e execute `npm install` novamente.
2. **Limpe o cache do npm:** Às vezes, o cache do npm pode estar corrompido. Execute `npm cache clean --force`.
3. **Remova e reinstale:** Exclua completamente a pasta `node_modules` e o arquivo `package-lock.json` (ou `npm-shrinkwrap.json` se existir) e execute `npm install` novamente:

    ```bash
    rm -rf node_modules package-lock.json # No Linux/macOS
    # ou use o explorador de arquivos no Windows
    npm install
    ```

4. **Verifique a versão do Node.js:** Certifique-se de que você está usando uma versão compatível do Node.js (v16.x ou superior é recomendado). Use um gerenciador de versão como NVM (Node Version Manager) se precisar gerenciar múltiplas versões.

### Erro durante a execução do `npm install` (especialmente com `better-sqlite3`)

**Problema**: O comando `npm install` falha com erros de compilação, frequentemente relacionados à biblioteca `better-sqlite3`.

**Solução**:

1. **Ferramentas de Compilação:** `better-sqlite3` é um módulo nativo e requer ferramentas de compilação no seu sistema.
    * **Linux (Debian/Ubuntu):** Instale os pacotes essenciais: `sudo apt-get update && sudo apt-get install -y python3 make g++ build-essential`
    * **Windows:** Pode ser necessário instalar as ferramentas de compilação do Visual Studio. A maneira mais fácil é usar o `windows-build-tools` (pode ser obsoleto para versões mais recentes do Node.js, verifique a documentação oficial do Node.js para requisitos de compilação): `npm install --global --production windows-build-tools` (execute este comando em um terminal com privilégios de administrador). Alternativamente, instale o Visual Studio Community Edition com as ferramentas de desenvolvimento para desktop com C++.
    * **macOS:** As ferramentas de linha de comando do Xcode geralmente são suficientes. Instale-as executando `xcode-select --install` no Terminal.
2. **Limpe e reinstale:** Após instalar as ferramentas de compilação, tente remover `node_modules` e `package-lock.json` e execute `npm install` novamente.

## 3. Problemas de Configuração (`.env`)

### O sistema não carrega as variáveis de ambiente do arquivo `.env`

**Problema**: As configurações definidas no seu arquivo `.env` parecem não estar sendo aplicadas (ex: a porta padrão 3000 é usada mesmo que você defina outra, ou segredos de segurança aparecem como `undefined`).

**Solução**:

1. **Verifique o nome do arquivo:** Certifique-se de que o arquivo se chama exatamente `.env` e está localizado na raiz do projeto.
2. **Copie do exemplo:** Garanta que você copiou o `.env.example` para `.env` e não apenas renomeou o exemplo (para manter o exemplo original).
3. **Formato do arquivo:** Verifique se o arquivo `.env` está formatado corretamente: `CHAVE=VALOR`, uma variável por linha, sem espaços extras ao redor do `=` (a menos que parte do valor), e valores com espaços ou caracteres especiais devem estar entre aspas (simples ou duplas).
4. **Reinicie o servidor:** As variáveis de ambiente são carregadas na inicialização do servidor. Sempre reinicie o processo Node.js após modificar o arquivo `.env`.
5. **Verifique o código:** Confirme se `require('dotenv').config();` está sendo chamado logo no início do seu arquivo principal do servidor (`server.js`).

### Erro de CORS no navegador (Frontend não consegue acessar a API)

**Problema**: Ao tentar acessar a interface pública ou administrativa, as requisições do navegador para a API do backend são bloqueadas com erros de CORS (Cross-Origin Resource Sharing) no console do navegador.

**Solução**:

1. **Ambiente de Desenvolvimento:** Em desenvolvimento, a configuração padrão de CORS no `server.js` permite qualquer origem (`CORS_ORIGIN=*`). Verifique se esta configuração não foi alterada acidentalmente.
2. **Ambiente de Produção:** Em produção, a variável de ambiente `CORS_ORIGIN` no seu arquivo `.env` **deve** ser configurada com o domínio exato (incluindo protocolo `http://` ou `https://`) onde seu frontend está sendo servido. Ex: `CORS_ORIGIN=https://seusite.com`. Se você tiver múltiplos domínios ou subdomínios, pode precisar de uma configuração mais avançada no middleware CORS.
3. **Verifique os logs do servidor:** O servidor pode estar registrando erros relacionados à configuração de CORS.

## 4. Problemas do Banco de Dados (SQLite)

### Erro de conexão com o banco de dados ou tabelas ausentes

**Problema**: O servidor inicia, mas os logs mostram erros relacionados ao banco de dados, ou as tabelas não parecem ter sido criadas.

**Solução**:

1. **Diretório `data/`:** Verifique se a pasta `data/` existe na raiz do projeto. Se não existir, crie-a manualmente.
2. **Permissões de escrita:** O usuário do sistema operacional que executa o processo Node.js precisa ter permissões de escrita na pasta `data/`. Verifique e ajuste as permissões se necessário.
3. **Inicialização Automática:** O arquivo `data/data.db` e suas tabelas devem ser criados e/ou migrados automaticamente na primeira inicialização do servidor através das chamadas a `lib/database.js` e `lib/db-init.js` em `server.js`. Verifique os logs do servidor durante a inicialização para mensagens de erro relacionadas a este processo.
4. **Arquivo Corrompido:** Se o arquivo `data/data.db` existir, mas você suspeitar que está corrompido, **faça um backup** do arquivo existente e tente removê-lo. Reinicie o servidor para forçar a recriação do banco de dados e das tabelas (você perderá os dados existentes se não tiver um backup válido).
5. **Ferramenta de DB:** Use uma ferramenta externa como "DB Browser for SQLite" para abrir o arquivo `data/data.db` e inspecionar seu conteúdo e esquema de tabelas diretamente.

### Dados não aparecem na interface após adicionar/importar

**Problema**: Você adicionou jogadores, criou torneios ou registrou placares (via scripts ou painel admin), mas eles não são exibidos na interface pública ou em outras seções do painel admin.

**Solução**:

1. **Verifique os logs do servidor:** Procure por erros nas rotas da API que deveriam estar retornando esses dados.
2. **Verifique o console do navegador:** Abra as ferramentas de desenvolvedor (F12) na aba "Console" e "Network" para ver se há erros nas chamadas de API ou no processamento dos dados no frontend.
3. **Inspecione o DB:** Use uma ferramenta como "DB Browser for SQLite" para verificar diretamente o arquivo `data/data.db` e confirmar se os dados foram realmente inseridos nas tabelas corretas.
4. **Lógica de Filtro/Seleção:** No painel admin, certifique-se de que você selecionou o "Torneio Ativo" correto. Na interface pública, verifique se o torneio correto está selecionado no dropdown.

## 5. Problemas de Inicialização do Servidor

### O servidor não inicia ou fecha imediatamente

**Problema**: Ao executar `npm run dev` ou `npm start`, o servidor não inicia ou fecha logo após iniciar.

**Solução**:

1. **Verifique os logs:** Esta é a fonte mais importante de informação. O erro que causa a falha na inicialização estará nos logs do console ou do gerenciador de processos (PM2, Systemd).
2. **Conflito de Porta:** Outro processo pode já estar usando a porta que o LASCMMG tenta usar (padrão 3000).
    * **Linux:** Use `sudo lsof -i :PORTA` (substitua PORTA) para ver qual processo está usando a porta.
    * **Windows:** Use `netstat -ano | findstr :PORTA`.
    * Altere a porta no arquivo `.env` (`PORT=...`) e tente iniciar novamente.
3. **Erros de Sintaxe:** Um erro de sintaxe em algum arquivo JavaScript pode impedir a inicialização. O linter (ESLint) e o Nodemon (em modo dev) geralmente ajudam a identificar isso.
4. **Variáveis de Ambiente Ausentes/Inválidas:** Se variáveis essenciais (especialmente em produção) como `JWT_SECRET` ou `COOKIE_SECRET` não estiverem definidas, o servidor pode falhar ao iniciar ou ao carregar middlewares. Verifique seu arquivo `.env`.

## 6. Problemas de Acesso e Autenticação

### Não consigo fazer login no painel administrativo

**Problema**: As credenciais de usuário e senha não funcionam na página `admin.html`.

**Solução**:

1. **Verifique as credenciais:** Confirme se o nome de usuário e a senha estão corretos. Lembre-se que a senha é case-sensitive.
2. **Inicialização do Admin:** Certifique-se de que o usuário administrador foi criado corretamente no banco de dados. Execute o script `node scripts/initialize_admin.js` novamente para garantir que o usuário existe (ele não duplicará se já existir).
3. **Arquivo `admin_credentials.json`:** Se você usou o script `initialize_admin.js`, verifique se o arquivo `admin_credentials.json` existe na raiz do projeto e contém o nome de usuário correto e um hash bcrypt **válido** para a senha.
4. **Logs do Servidor:** O servidor registra tentativas de login (bem-sucedidas e falhas). Verifique os logs para ver se há mensagens relacionadas à autenticação.
5. **Cookies e Local Storage:** Limpe os cookies e o local storage do seu navegador para o domínio da aplicação. Informações de sessão antigas podem causar conflitos.
6. **Variáveis de Segurança:** Em produção, certifique-se de que `JWT_SECRET` e `COOKIE_SECRET` estão definidos no seu `.env`. Valores incorretos ou ausentes podem impedir a autenticação.

### Logout não funciona ou sessão persiste

**Problema**: Ao clicar em sair, o usuário continua logado ou consegue acessar áreas restritas.

**Solução**:

1. **Logs do Servidor:** Verifique os logs para ver se a rota de logout (`/api/auth/logout`) está sendo chamada e processada corretamente.
2. **Blacklist de Tokens:** O sistema utiliza uma blacklist em memória para tokens JWT. Se o servidor for reiniciado, a blacklist é perdida. Em um ambiente com múltiplos processos ou reinícios frequentes, a blacklist precisa ser persistente (ver `TODO.md` e `SCALING.md` sobre o uso de Redis para isso).
3. **Cookies:** Verifique se os cookies de autenticação estão sendo removidos corretamente pelo navegador após o logout.
4. **Cache do Navegador:** Limpe o cache do navegador.

## 7. Problemas de Interface e Frontend

### Elementos da página não carregam ou aparecem quebrados

**Problema**: Partes da interface (botões, formulários, chaveamento) não são exibidas corretamente ou parecem desformatadas.

**Solução**:

1. **Cache do Navegador:** Limpe o cache e os cookies do seu navegador (Ctrl+F5 ou Cmd+Shift+R para um hard refresh).
2. **Console do Navegador:** Abra as ferramentas de desenvolvedor (F12) e verifique a aba "Console" para erros JavaScript e a aba "Network" para ver se todos os arquivos (HTML, CSS, JS, imagens) estão sendo carregados corretamente (status HTTP 200).
3. **Arquivos Estáticos:** Certifique-se de que os diretórios `css/`, `js/` e `assets/` estão na raiz do projeto e que o servidor está configurado para servi-los corretamente (ver `server.js`).
4. **Problemas de Tema:** Se o problema parecer relacionado ao estilo, tente alternar o tema (claro/escuro) para ver se o problema persiste. Limpar o `localStorage` do navegador também pode ajudar (`localStorage.removeItem('theme-preference');`).
5. **Testar em Outro Navegador:** Verifique se o problema ocorre em outros navegadores para descartar problemas de compatibilidade.

### Funcionalidades do Frontend não respondem (botões, formulários)

**Problema**: Clicar em botões, enviar formulários ou interagir com elementos da interface não produz o resultado esperado.

**Solução**:

1. **Console do Navegador:** Verifique a aba "Console" para erros JavaScript que possam estar impedindo a execução do código.
2. **Aba Network:** Verifique se as requisições de API esperadas estão sendo feitas (status HTTP 200, 400, 500, etc.) e qual a resposta do servidor.
3. **Logs do Servidor:** Se as requisições de API estiverem chegando ao servidor (status diferente de 404), verifique os logs do servidor para erros no backend ao processar essas requisições.
4. **Torneio Selecionado:** No painel administrativo, certifique-se de que o "Torneio Ativo" correto está selecionado para as operações de gerenciamento.

## 8. Problemas de Performance

### O sistema está lento para carregar ou responder

**Problema**: As páginas demoram para carregar, as ações na interface levam tempo para serem concluídas, ou as requisições de API são lentas.

**Solução**:

1. **Monitoramento de Recursos:** Verifique o uso de CPU, memória e I/O de disco no servidor onde a aplicação está rodando. Altos níveis podem indicar um gargalo.
2. **Logs do Servidor:** Procure por mensagens de log que indiquem operações demoradas (ex: consultas de banco de dados lentas).
3. **Otimização de Banco de Dados:**
    * Certifique-se de que os índices apropriados existem nas tabelas SQLite (ver `lib/database.js`).
    * Considere executar `VACUUM` no arquivo `data/data.db` para otimização (ver `SCALING.md` e `TODO.md`).
    * Avalie a implementação do modo WAL para SQLite (ver `SCALING.md` e `TODO.md`).
4. **Otimização de Queries:** Analise e otimize as consultas SQL nos modelos que estão causando lentidão.
5. **Aba Performance (Navegador):** Use a aba "Performance" nas ferramentas de desenvolvedor do navegador para identificar gargalos no frontend (renderização, scripts demorados).
6. **Rede:** Verifique a latência da rede entre o cliente e o servidor.
7. **Escalabilidade:** Se o problema for persistente sob carga, pode ser necessário escalar o sistema (vertical ou horizontalmente, consulte `SCALING.md`).

## 9. Problemas de Implantação

(Para problemas específicos de Docker, Nginx, Systemd/PM2, consulte o guia `DEPLOYMENT.md`.)

### Contêiner Docker não inicia ou falha na construção

**Problema**: `docker build` ou `docker-compose up` falha.

**Solução**:

1. **Logs do Docker:** Examine cuidadosamente a saída do comando `docker build` ou os logs do contêiner (`docker logs <container_id>` ou `docker-compose logs <service_name>`). O erro exato estará lá.
2. **Dependências de Compilação:** Se o erro for durante `npm install` dentro do Dockerfile, pode ser que as ferramentas de compilação para `better-sqlite3` não estejam instaladas na imagem base (ver seção 2 deste guia e o `Dockerfile` de exemplo em `DEPLOYMENT.md`).
3. **Variáveis de Ambiente:** Certifique-se de que as variáveis de ambiente necessárias estão sendo passadas corretamente para o contêiner (via `environment` no `docker-compose.yml` ou arquivo `.env` referenciado).
4. **Permissões de Volume:** Se estiver usando volumes para persistir `data/` ou `backups/`, verifique se o usuário dentro do contêiner tem permissões de escrita nesses volumes no host.

### Nginx não serve a aplicação Node.js

**Problema**: Ao acessar o domínio configurado no Nginx, você vê um erro do Nginx (ex: 502 Bad Gateway) ou a página padrão do Nginx, em vez da aplicação LASCMMG.

**Solução**:

1. **Configuração do Nginx:** Verifique o arquivo de configuração do seu site no Nginx (geralmente em `/etc/nginx/sites-available/` ou `/etc/nginx/conf.d/`).
2. **`proxy_pass`:** Confirme se a diretiva `proxy_pass` está apontando para o endereço e porta corretos onde sua aplicação Node.js está escutando (ex: `http://localhost:3000;`).
3. **Aplicação Node.js Rodando:** Certifique-se de que a aplicação Node.js está realmente rodando e escutando na porta configurada (verifique com `lsof` ou `netstat` no servidor).
4. **Logs do Nginx:** Examine os logs de erro do Nginx (ex: `/var/log/nginx/error.log`) para mensagens que indiquem a causa da falha na conexão com o backend.
5. **Firewall:** Verifique se um firewall no servidor está bloqueando a comunicação entre o Nginx e a porta da aplicação Node.js (geralmente na interface de loopback `localhost`).

### Serviço Systemd/PM2 não inicia ou falha

**Problema**: O gerenciador de processos não consegue iniciar ou manter a aplicação Node.js rodando.

**Solução**:

1. **Logs do Gerenciador:** Use os comandos do gerenciador para ver os logs da aplicação (ex: `sudo journalctl -u lascmmg -f` para Systemd, `pm2 logs lascmmg` para PM2). O erro de inicialização estará lá.
2. **Caminhos:** Verifique se os caminhos no arquivo de serviço (WorkingDirectory, ExecStart) estão corretos e apontam para o diretório raiz do projeto e o arquivo `server.js`.
3. **Permissões:** Certifique-se de que o usuário configurado no arquivo de serviço (se não for root) tem permissões para acessar o diretório do projeto e executar o arquivo `server.js`.
4. **EnvironmentFile (Systemd):** Se estiver usando `EnvironmentFile` no Systemd, verifique se o caminho para o arquivo `.env` está correto e se o arquivo tem permissões de leitura para o usuário do serviço.
5. **Variáveis de Ambiente:** Confirme se todas as variáveis de ambiente necessárias para o ambiente de produção estão definidas no arquivo `.env` referenciado ou no ambiente do sistema.

## 10. Coletando Informações para Suporte

Se você precisar de ajuda externa (ex: abrir uma issue no GitHub), forneça o máximo de detalhes possível:

* Descrição clara do problema e os passos para reproduzi-lo.
* As informações essenciais listadas na Seção 1.
* Trechos relevantes dos logs do servidor e do console do navegador.
* Qualquer mensagem de erro completa que você tenha recebido.
* Configuração do seu arquivo `.env` (remova quaisquer segredos ou informações sensíveis antes de compartilhar!).
* Se relevante, detalhes da sua configuração de implantação (Docker, Nginx, Systemd, etc.).

---

Este guia será atualizado conforme novos problemas forem identificados e solucionados.
