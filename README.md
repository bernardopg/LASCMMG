# Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG)

## 🎱 Gerencie Seus Torneios de Sinuca com Eficiência e Segurança!

O LASCMMG é um sistema web completo e robusto, projetado para simplificar a organização e o acompanhamento de torneios de sinuca. Seja para um clube local ou uma competição maior, o LASCMMG oferece as ferramentas necessárias para gerenciar chaveamentos, registrar placares e administrar jogadores de forma intuitiva e segura.

Desenvolvido com Node.js, Express no backend e JavaScript Vanilla no frontend, utilizando SQLite para persistência de dados, o sistema é performático, fácil de implantar e focado na experiência do usuário e na segurança.

## ✨ Funcionalidades em Destaque

*   **Visualização Dinâmica de Torneios:** Navegue facilmente entre torneios passados e futuros com uma interface clara e responsiva.
*   **Chaveamentos Interativos:** Visualize a estrutura de partidas em formatos de eliminatória simples ou dupla, com atualização em tempo real dos resultados.
*   **Histórico Completo de Placares:** Acesse uma tabela detalhada com todos os placares registrados, com opções de ordenação e filtragem.
*   **Painel Administrativo Seguro:** Uma área restrita com autenticação robusta para controle total:
    *   **Dashboard:** Visão geral e estatísticas chave dos torneios ativos.
    *   **Gerenciamento de Torneios:** Crie, edite e controle o ciclo de vida dos torneios (Pendente, Em Andamento, Concluído, Cancelado), definindo todos os detalhes, desde nome e data até regras e premiação.
    *   **Gerenciamento de Jogadores:** Adicione, edite, exclua jogadores individualmente ou importe listas completas via JSON.
    *   **Geração Automática de Chaveamento:** Gere a estrutura de partidas com base nos jogadores inscritos com um clique.
    *   **Agendamento Flexível:** Defina ou ajuste datas e horários para as partidas.
    *   **Registro e Edição de Placares:** Insira e modifique os resultados das partidas de forma rápida.
    *   **Lixeira Inteligente:** Gerencie torneios cancelados, com opções de restauração ou exclusão permanente segura.
*   **Design Moderno e Responsivo:** Interface adaptável a qualquer dispositivo (desktops, tablets, celulares) com temas claro e escuro personalizáveis.
*   **Foco em Acessibilidade (A11y):** Melhorias contínuas para garantir que o sistema seja utilizável por todos, incluindo navegação por teclado e uso de atributos ARIA.
*   **Segurança de Nível Profissional:** Proteção integrada contra as ameaças web mais comuns:
    *   Prevenção contra XSS (Cross-Site Scripting).
    *   Proteção contra CSRF (Cross-Site Request Forgery) com tokens.
    *   Headers de segurança HTTP robustos via Helmet.
    *   Rate limiting para mitigar ataques de força bruta e DoS.
    *   Uso de cookies seguros (HttpOnly, Secure, SameSite).
    *   Mecanismo de Honeypot para detecção e bloqueio de bots maliciosos.
    *   Autenticação JWT com blacklist de tokens e proteção contra brute-force.
    *   Senhas armazenadas com hashing seguro (bcrypt).
*   **Persistência Confiável:** Dados armazenados em um banco de dados SQLite local, garantindo performance e facilidade de gerenciamento para a maioria dos casos de uso.

## 🛠️ Configuração e Execução Rápida

Para colocar o LASCMMG para rodar, siga estes passos simples:

### 1. Pré-requisitos

Certifique-se de ter instalado em seu sistema:

*   **Node.js:** Versão 16.x ou superior (recomendado).
*   **npm:** Gerenciador de pacotes do Node.js (geralmente incluído na instalação do Node.js).
*   **Git:** Para clonar o repositório.
*   **Ferramentas de Compilação:** Em alguns sistemas, a biblioteca `better-sqlite3` pode precisar de ferramentas de compilação (como Python, Make, C/C++ compiler) durante a instalação das dependências.

### 2. Instalação

Clone o repositório do projeto e instale as dependências:

```bash
# Clone o repositório (substitua pela URL real do seu repositório)
git clone <url-do-repositorio> lascmmg
cd lascmmg

# Instale as dependências do projeto
npm install
```

### 3. Configuração do Ambiente

Copie o arquivo de exemplo de variáveis de ambiente e configure-o:

```bash
# Copie o arquivo de configuração de exemplo
cp .env.example .env
```

Edite o arquivo recém-criado `.env` e defina as variáveis essenciais. **Para ambientes de produção, é CRUCIAL definir valores fortes e únicos para `COOKIE_SECRET` e `JWT_SECRET`**.

```ini
# Exemplo de configuração no arquivo .env
PORT=3000
NODE_ENV=development # Use 'production' para ambiente de produção
COOKIE_SECRET=sua_chave_secreta_longa_e_aleatoria_para_cookies
JWT_SECRET=sua_chave_secreta_longa_e_aleatoria_para_jwt
JWT_EXPIRATION=1h # Tempo de expiração do token JWT (ex: 1h, 7d)
JWT_ISSUER=seu_dominio.com # Emissor do token JWT
JWT_AUDIENCE=seu_dominio.com # Audiência do token JWT
CORS_ORIGIN=* # Domínio permitido para requisições CORS em desenvolvimento. Use o domínio do seu frontend em produção (ex: https://seusite.com)
RATE_LIMIT_WINDOW_MS=900000 # Janela de tempo para rate limiting (15 minutos)
RATE_LIMIT_MAX=100 # Máximo de requisições por IP na janela
# Outras variáveis podem ser adicionadas conforme .env.example
```

### 4. Inicialização do Banco de Dados e Primeiro Administrador

O banco de dados SQLite (`data/data.db`) e suas tabelas são criados automaticamente na primeira vez que o servidor é iniciado.

Para criar o primeiro usuário administrador, **recomendamos** usar o script dedicado:

```bash
# Execute o script para criar o admin. Siga os prompts ou use argumentos:
node scripts/initialize_admin.js --username seu_usuario_admin --password sua_senha_forte_aqui
```

**Nota:** Este script utiliza um arquivo `admin_credentials.json` (que você precisará criar ou atualizar com o nome de usuário e um hash bcrypt **pré-gerado** da senha) para adicionar o usuário ao banco de dados. Consulte `scripts/initialize_admin.js` para mais detalhes sobre a dependência do arquivo JSON.

### 5. Execução do Servidor

Escolha o modo de execução:

*   **Modo de Desenvolvimento (com reinício automático via Nodemon):**
    ```bash
    npm run dev
    ```
*   **Modo de Produção:**
    ```bash
    npm start
    ```

O servidor estará acessível em `http://localhost:[PORTA]` (onde `[PORTA]` é a porta configurada no `.env`, padrão 3000).

*   **Interface Pública:** `http://localhost:[PORTA]`
*   **Painel Administrativo:** `http://localhost:[PORTA]/admin.html`

## 🧪 Testes Automatizados

O projeto utiliza [Vitest](https://vitest.dev/) para garantir a qualidade do código através de testes unitários.

*   Execute todos os testes:
    ```bash
    npm test
    ```
*   Execute os testes em modo de observação (watch mode):
    ```bash
    npm run test:watch
    ```

## 📂 Estrutura de Arquivos (Principais)

```
/
├── admin.html              # Página do painel administrativo
├── admin-security.html     # Página de estatísticas de segurança
├── index.html              # Página pública principal
├── server.js               # Ponto de entrada do servidor Express
├── package.json            # Dependências e scripts do projeto
├── .env.example            # Exemplo de variáveis de ambiente
├── .env                    # Variáveis de ambiente (configuração local)
├── data/                   # Contém o arquivo do banco de dados SQLite
│   └── data.db             # Arquivo do banco de dados
├── js/                     # Código JavaScript do Frontend (modularizado)
├── css/                    # Arquivos CSS
├── lib/                    # Código do Backend (modelos, middlewares, utilitários)
├── routes/                 # Definições das rotas da API Express
├── scripts/                # Scripts utilitários (backup, inicialização, etc.)
└── tests/                  # Testes unitários
    └── unit/               # Testes unitários específicos
```

## 🛡️ Segurança Detalhada

O LASCMMG foi construído com a segurança em mente. Além das medidas já mencionadas, o sistema inclui:

*   **Middleware de Autenticação JWT:** Protege as rotas da API, garantindo que apenas usuários autenticados e autorizados possam acessá-las.
*   **Blacklist de Tokens JWT:** Permite invalidar tokens após logout ou em caso de comprometimento.
*   **Validação de Entrada:** Dados recebidos nas requisições são validados para prevenir injeções e outros ataques.
*   **Tratamento Centralizado de Erros:** Evita que informações sensíveis do servidor vazem para o cliente em caso de falhas.

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os padrões de codificação definidos em `CODING_STANDARDS.md` e o fluxo de trabalho de Pull Request.

1.  Faça um fork do projeto.
2.  Crie uma branch para sua feature ou correção (`git checkout -b feature/minha-feature`).
3.  Faça commit de suas mudanças (`git commit -am 'feat: Adiciona minha feature'`).
4.  Envie para o seu fork (`git push origin feature/minha-feature`).
5.  Abra um Pull Request para o repositório original.

Certifique-se de que seus commits sigam o padrão [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) e que os testes (`npm test`) e o lint (`npm run lint`) passem.

## 📄 Licença

Este projeto está licenciado sob a Licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

---

Desenvolvido com paixão pela sinuca e por código de qualidade.
