# Manual do Usuário - Sistema de Gerenciamento de Torneios de Sinuca LASCMMG

[⬅ Voltar ao README](README.md)

## Índice

- [Introdução](#🎯-domine-o-lascmmg-seu-guia-completo-para-gerenciar-torneios-de-sinuca)
- [Visualização Pública](#1-explorando-a-visualização-pública-indexhtml)
- [Painel Administrativo](#2-gerenciando-torneios-o-painel-administrativo-adminhtml)
- [Navegação e Dicas](#13-menu-de-perfil-e-acesso-rápido-canto-superior-direito)
- [Personalização](#14-personalizando-sua-experiência-alternador-de-tema)

---

## 🎯 Domine o LASCMMG: Seu Guia Completo para Gerenciar Torneios de Sinuca

Bem-vindo ao manual oficial do Sistema de Gerenciamento de Torneios de Sinuca da LASCMMG! Este documento foi elaborado para guiar você através de todas as funcionalidades, desde a simples visualização de torneios até a administração completa. Nosso objetivo é que você aproveite ao máximo o sistema, seja como espectador ou como administrador.

O LASCMMG é uma ferramenta poderosa e intuitiva, desenvolvida para simplificar a organização e o acompanhamento de competições de sinuca, utilizando um eficiente banco de dados SQLite para armazenar todas as informações de forma segura e acessível.

## 1. Explorando a Visualização Pública (`index.html`)

A página principal é o ponto de encontro para acompanhar o andamento dos torneios. Qualquer pessoa pode acessar e visualizar as informações sem necessidade de login.

### 1.1. Selecionando um Torneio para Acompanhar

* No topo da página, você encontrará um menu suspenso (dropdown) com a lista de todos os torneios disponíveis.
* Os torneios são listados e ordenados pela data, facilitando encontrar o que você procura.
* **Clique no nome de um torneio** para selecioná-lo e carregar seus detalhes (chaveamento, placares, etc.).
* **Dica:** A URL na barra de endereços do seu navegador é atualizada ao selecionar um torneio. Você pode copiar e compartilhar este link direto com outras pessoas!

### 1.2. Navegando pelas Informações do Torneio (Barra Lateral Esquerda)

A barra lateral oferece acesso rápido às diferentes seções do torneio selecionado:

* 🏠 **Início:** Retorna à página inicial do sistema.
* 📊 **Chaveamento:** Exibe a estrutura visual das partidas do torneio, mostrando quem joga contra quem e o progresso das fases.
* 📜 **Histórico de Placares:** Uma tabela completa com todos os resultados de partidas já registrados. Você pode **ordenar** as colunas clicando nos cabeçalhos e usar os **filtros** para encontrar placares específicos.
* ➕ **Adicionar Placar:** (Visível apenas para administradores logados) Permite inserir novos resultados de partidas.
* 📈 **Estatísticas:** Apresenta dados e gráficos relevantes sobre o desempenho dos jogadores e o andamento do torneio.
* 🔑 **Login Admin / Voltar para Admin:** Este link muda dependendo se você está logado como administrador. Use-o para acessar a área de login ou retornar ao painel administrativo se já estiver logado.

### 1.3. Menu de Perfil e Acesso Rápido (Canto Superior Direito)

* Clique no ícone de perfil no canto superior direito.
* Se não estiver logado, verá a opção "Área Admin" para ir para a página de login.
* Se estiver logado como administrador, verá a opção "Sair (Admin)" para fazer logout.

### 1.4. Personalizando Sua Experiência: Alternador de Tema

* Encontre o botão de alternar tema (geralmente um ícone de sol/lua).
* Clique nele para alternar entre o **Tema Claro** e o **Tema Escuro**.
* Sua preferência de tema é salva automaticamente no seu navegador, então o sistema lembrará da sua escolha na próxima visita. O sistema também respeita a configuração de tema do seu sistema operacional na primeira vez que você acessa.

## 2. Gerenciando Torneios: O Painel Administrativo (`admin.html`)

Esta área é restrita e requer autenticação para acesso. Aqui você tem controle total sobre os torneios.

### 2.1. Acesso e Saída Segura

* **Login:** Acesse a página `admin.html` no seu navegador. Insira seu nome de usuário e senha de administrador nos campos indicados e clique no botão "Entrar".
* **Logout:** Para sair da área administrativa, clique no botão "Sair" na barra lateral esquerda ou na opção "Sair (Admin)" no menu de perfil no canto superior direito.

### 2.2. Navegação no Painel Administrativo (Barra Lateral Esquerda)

A barra lateral na área admin oferece acesso às ferramentas de gerenciamento:

* 🏠 **Painel Administrativo:** A página inicial da área admin, com um resumo das atividades e estatísticas importantes.
* 🏆 **Torneios:** A seção principal para criar, visualizar e gerenciar seus torneios.
* 📅 **Agendamento:** Defina ou altere as datas e horários das partidas.
* 🔢 **Placares:** Adicione, edite ou visualize os placares das partidas.
* 👤 **Jogadores:** Gerencie a lista de jogadores inscritos em um torneio.
* 🗑️ **Lixeira:** Visualize e gerencie torneios que foram cancelados.
* 🔒 **Segurança:** Um link direto para a página `admin-security.html`, onde você pode ver estatísticas relacionadas à segurança, como atividades do honeypot.
* ⬅️ **Voltar ao Torneio:** Retorna para a visualização pública do torneio selecionado em `index.html`.

### 2.3. Selecionando o Torneio Ativo para Administração

* No topo da barra lateral administrativa, há um menu suspenso para **"Selecionar Torneio Ativo"**.
* Escolha o torneio que você deseja administrar no momento. Todas as ações nas seções de gerenciamento (Agendamento, Placares, Jogadores) serão aplicadas a este torneio.
* Apenas torneios que não estão na lixeira aparecem nesta lista.
* Clique no botão "Atualizar" ao lado do menu para recarregar a lista de torneios, caso tenha criado um novo recentemente.

### 2.4. Gerenciando Seus Torneios (Seção "Torneios")

Esta é a central de controle dos seus eventos.

* **Criar Novo Torneio:**
    * Preencha os campos necessários: Nome do Torneio, Data, Descrição, Número Esperado de Jogadores, Tipo de Chaveamento (Eliminatória Simples, Dupla, etc.), Taxa de Inscrição, Premiação e Regras Específicas.
    * Clique no botão "Criar Torneio".
* **Torneios Existentes:**
    * Uma tabela lista todos os torneios que não estão na lixeira.
    * **Selecionar:** Clique no botão "Selecionar" na linha de um torneio para defini-lo como o torneio ativo para administração.
    * **Visualizar:** Clique no botão "Visualizar" para abrir a página pública (`index.html`) deste torneio em uma nova aba.
    * **Mover para Lixeira:** Clique neste botão para marcar o torneio como 'Cancelado' e movê-lo para a seção "Lixeira".
* **Detalhes do Torneio Selecionado:**
    * Ao selecionar um torneio, seus detalhes aparecem para edição.
    * Você pode editar o Nome, Descrição, Status (Pendente, Em Andamento, Concluído, Cancelado), Taxa de Inscrição, Premiação e Regras.
    * A Data e o Tipo de Chaveamento são definidos na criação e não podem ser alterados posteriormente.
    * Clique em "Salvar Alterações" para persistir suas modificações.

### 2.5. Agendando Partidas (Seção "Agendamento")

* Certifique-se de que o torneio desejado está selecionado como "Torneio Ativo".
* Nesta seção, você verá a lista de partidas pendentes.
* Selecione uma partida e utilize os campos para definir a data e a hora em que ela ocorrerá.

### 2.6. Gerenciando Placares (Seção "Placares")

* Certifique-se de que o torneio desejado está selecionado como "Torneio Ativo".
* **Adicionar/Editar Placar:** Selecione a partida na lista, insira os placares dos jogadores nos campos correspondentes. Opcionalmente, você pode ajustar a data e hora da partida aqui também.
* **Histórico de Placares:** Uma tabela exibe todos os placares já registrados para o torneio ativo, com opções para **editar** ou **excluir** um placar existente.

### 2.7. Gerenciando Jogadores (Seção "Jogadores")

* Certifique-se de que o torneio desejado está selecionado como "Torneio Ativo".
* **Adicionar Jogador:** Utilize o formulário para inserir um novo jogador no torneio, informando Nome, Apelido, Gênero (opcional) e Nível de Habilidade (opcional).
* **Lista de Jogadores:** Uma tabela exibe todos os jogadores inscritos no torneio ativo. Você pode **editar** as informações de um jogador ou **excluí-lo** do torneio.
* **Importar Jogadores (JSON):** Clique no botão "Importar JSON" para adicionar ou atualizar jogadores em massa a partir de um arquivo no formato JSON. Consulte o formato esperado no código ou em um arquivo de exemplo se disponível.
* **Exportar Jogadores:** Clique neste botão para baixar um arquivo JSON contendo a lista atual de jogadores do torneio ativo. Útil para backups ou importação em outros sistemas/torneios.

### 2.8. Gerenciando a Lixeira (Seção "Lixeira")

* Nesta seção, você encontra todos os torneios que foram marcados como 'Cancelado'.
* **Restaurar:** Clique neste botão para mudar o status de um torneio de volta para 'Pendente', removendo-o da lixeira e tornando-o disponível novamente na lista principal de torneios.
* **Excluir Permanentemente:** Esta ação **não pode ser desfeita**. Clique neste botão para remover um torneio e todos os seus dados associados (jogadores, partidas, placares) do sistema de forma definitiva. Requer confirmação.
* **Esvaziar Lixeira:** Exclui permanentemente todos os torneios que estão na lixeira. Requer confirmação.

## 3. Aspectos Técnicos e Administração do Servidor

Esta seção aborda pontos importantes para quem administra a infraestrutura do sistema.

### 3.1. Persistência de Dados com SQLite

* Todos os dados do sistema (torneios, jogadores, placares, etc.) são armazenados em um único arquivo de banco de dados SQLite, localizado em `data/data.db` na raiz do projeto.
* A biblioteca `better-sqlite3` é utilizada para interagir com o banco de dados, oferecendo performance e segurança.

### 3.2. Administração de Usuários (Admin)

* **Criação do Primeiro Administrador:** O usuário administrador inicial é criado utilizando o script `scripts/initialize_admin.js`. Este script lê as credenciais (nome de usuário e hash de senha bcrypt) de um arquivo `admin_credentials.json` e as insere no banco de dados.
* **Gerenciamento de Senhas:** A senha do administrador é armazenada como um hash bcrypt seguro. Para alterar a senha de um administrador existente, utilize a funcionalidade de "Alterar Senha" disponível no painel de autenticação (`/api/auth/change-password`) ou, se necessário, atualize o hash diretamente no banco de dados (procedimento avançado, requer cuidado).
* **Segurança das Credenciais:** Utilize senhas fortes e únicas para a conta de administrador.

## 4. Observações Importantes para uma Boa Experiência

* **Backups Regulares:** O arquivo `data/data.db` contém todos os seus dados. **É CRUCIAL realizar backups regulares deste arquivo.** Utilize o script `scripts/backup-database.js` e considere automatizá-lo (ex: via cron job) para evitar perda de dados.
* **Segurança em Produção:** Ao implantar em um ambiente de produção, siga rigorosamente as recomendações de segurança (configuração de variáveis de ambiente, uso de HTTPS, firewalls, etc.) detalhadas no guia `DEPLOYMENT.md`.
* **Performance:** Para torneios muito grandes ou em cenários de alto tráfego, consulte o guia `SCALING.md` para estratégias de otimização e escalabilidade.

---

Esperamos que este manual torne sua experiência com o LASCMMG a mais fluida e produtiva possível! Se tiver dúvidas ou encontrar problemas, consulte o guia `TROUBLESHOOTING.md` ou procure suporte.

---

[⬆ Voltar ao topo](#manual-do-usuário---sistema-de-gerenciamento-de-torneios-de-sinuca-lascmmg) | [Voltar ao README](README.md)
