# Manual do Usuário - Sistema de Gerenciamento de Torneios de Sinuca LASCMMG

## Introdução

Bem-vindo ao Sistema de Gerenciamento de Torneios de Sinuca da LASCMMG! Este manual guiará você através das funcionalidades disponíveis tanto para visualização pública quanto para administração dos torneios. O sistema utiliza um banco de dados SQLite para armazenar todas as informações de forma robusta.

## 1. Visualização Pública (`index.html`)

Esta é a página principal onde qualquer pessoa pode visualizar o andamento dos torneios.

### 1.1. Selecionar um Torneio

- No topo da página, você encontrará um menu suspenso (dropdown).
- Clique nele para ver a lista de torneios disponíveis, ordenados por data (mais recentes primeiro).
- Selecione um torneio para visualizar seus detalhes (chaveamento e placares).
- O torneio selecionado ficará ativo e seu chaveamento será exibido por padrão. A URL também será atualizada para refletir o torneio selecionado, permitindo o compartilhamento de links diretos.

### 1.2. Navegação (Barra Lateral Esquerda)

- **Início:** Retorna à página inicial de boas-vindas.
- **Chaveamento:** Exibe a estrutura de partidas do torneio selecionado. Mostra os jogadores, o placar (`-` se não jogado), e a data/hora agendada (ou "TBD"). Vencedores são destacados.
- **Histórico de Placares:** Mostra uma tabela com todos os placares registrados para o torneio selecionado. Você pode ordenar a tabela clicando nos cabeçalhos das colunas e usar os filtros para refinar a busca.
- **Adicionar Placar:** (Visível apenas para administradores logados) Permite registrar o resultado de uma partida do torneio selecionado.
- **Estatísticas:** Exibe estatísticas relevantes sobre o torneio selecionado.
- **Login Admin / Voltar para Admin:**
  - Se você não estiver logado como administrador, verá um botão "Login Admin" que leva à página de administração.
  - Se estiver logado, verá o botão "Voltar para Admin". O logout é feito pelo Menu de Perfil.

### 1.3. Menu de Perfil (Canto Superior Direito)

- Um ícone de perfil aparece no canto superior direito.
- Clicar nele abre um menu:
  - Se não estiver logado: Mostra um link para a "Área Admin".
  - Se estiver logado: Mostra um botão "Sair (Admin)".

### 1.4. Alternador de Tema

- Um botão (geralmente no canto inferior direito ou em local acessível) permite alternar entre os temas visuais:
  - **Tema Faculdade (Claro):** Tema padrão com cores claras, baseado na identidade visual da LASCMMG (verdes e dourados).
  - **Tema Faculdade (Escuro):** Versão escura do tema Faculdade, mantendo a paleta de cores adaptada para fundos escuros.
- Sua preferência de tema é salva localmente no navegador. O sistema também tenta respeitar a preferência de tema do seu sistema operacional na primeira visita.

## 2. Painel Administrativo (`admin.html`)

Esta área é restrita e requer login para acessar as funcionalidades de gerenciamento.

### 2.1. Login e Logout

- **Login:** Acesse `admin.html`. Insira o nome de usuário e senha corretos e clique em "Entrar".
- **Logout:**
  - Clique no botão "Sair" na parte inferior da barra lateral esquerda.
  - Ou clique no ícone de perfil no canto superior direito e depois no botão "Sair" no menu flutuante.

### 2.2. Navegação (Barra Lateral Esquerda - Admin)

- **Painel Administrativo:** Dashboard com resumo de torneios ativos, próximos jogos e estatísticas do sistema.
- **Torneios:** Gerenciar torneios existentes (editar detalhes, status) e criar novos.
- **Agendamento:** Definir ou alterar data e hora das partidas pendentes para o torneio selecionado.
- **Placares:** Adicionar ou editar placares (e opcionalmente a data/hora) para o torneio selecionado.
- **Jogadores:** Gerenciar a lista de jogadores do torneio selecionado (adicionar, editar, excluir, importar).
- **Lixeira:** Visualizar torneios movidos para a lixeira, com opções para restaurá-los ou excluí-los permanentemente.
- **Segurança:** (Link para `admin-security.html`) Acesso a estatísticas e configurações de segurança do sistema.
- **Voltar ao Torneio:** Retorna à página de visualização pública (`index.html`).

### 2.3. Selecionar Torneio Ativo (Admin)

- Use o menu suspenso no topo da área de conteúdo para selecionar o torneio que deseja administrar.
- Apenas torneios com status diferente de 'NaLixeira' aparecerão aqui.
- Clique em "Atualizar" para recarregar a lista de torneios do servidor.

### 2.4. Gerenciamento de Torneios (Seção "Torneios")

- **Criar Novo Torneio:**
  - Preencha o nome, data, descrição (opcional).
  - Selecione o número de jogadores e o tipo de chaveamento.
  - Opcionalmente, importe uma lista inicial de jogadores via arquivo JSON (um exemplo do formato pode ser encontrado na ajuda contextual da seção "Jogadores").
  - Clique em "Criar Torneio". O torneio será salvo no banco de dados.
- **Torneios Existentes:**
  - A tabela lista os torneios ativos (não na lixeira).
  - **Selecionar:** Define o torneio como o ativo para administração nas outras seções. A linha selecionada será destacada e o formulário "Detalhes do Torneio Selecionado" será preenchido.
  - **Visualizar:** Abre a página pública (`index.html`) para aquele torneio em uma nova aba.
  - **Excluir:** Move o torneio para a Lixeira (atualiza o status do torneio no banco de dados para 'NaLixeira').
- **Detalhes do Torneio Selecionado:**
  - Após selecionar um torneio, seus detalhes aparecem em um card para edição.
  - Você pode editar o Nome, Descrição e Status.
  - Data e Tipo de Chaveamento são apenas para visualização após a criação.
  - Clique em "Salvar Alterações" para persistir as mudanças no banco de dados.

### 2.5. Agendamento de Partidas (Seção "Agendamento")

- _Requer um torneio selecionado._
- **Selecionar Partida:** Escolha uma partida pendente (sem placar registrado) no menu suspenso.
- **Nova Data/Hora:** Use o seletor para escolher a nova data e hora.
- **Salvar Agendamento:** Salva a data/hora no banco de dados para a partida.

### 2.6. Gerenciamento de Placares (Seção "Placares")

- _Requer um torneio selecionado._
- **Adicionar/Editar Placar:**
  - **Selecionar Partida:** Escolha uma partida do chaveamento. Isso preencherá os jogadores e a rodada.
  - **Placares:** Insira os placares (0, 1 ou 2).
  - **Data/Hora da Partida:** (Opcional) Defina ou ajuste a data/hora da partida.
  - **Salvar Placar:** Registra o placar no banco de dados. Isso também pode avançar jogadores no chaveamento.
- **Histórico de Placares:**
  - Lista os placares do torneio.
  - **Editar/Excluir:** Permite modificar ou remover registros de placar.

### 2.7. Gerenciamento de Jogadores (Seção "Jogadores")

- _Requer um torneio selecionado._
- **Adicionar Jogador:** Insira nome e apelido.
- **Lista de Jogadores:** Edite ou exclua jogadores do torneio.
- **Importar JSON:** Adicione/atualize jogadores em massa via arquivo JSON.

### 2.8. Gerenciamento do Torneio Selecionado (Seção "Torneio")

- _Requer um torneio selecionado._
- **Chaveamento:** Visualização do chaveamento. Clicar em uma partida pode levar à edição de placar.
- **Ações do Torneio:**
  - **Gerar Chaveamento Automático:** Cria/recria o chaveamento com base nos jogadores.
  - **Reiniciar Torneio:** Limpa placares e estado do chaveamento.
  - **Exportar Dados:** (Funcionalidade pode variar) Permite exportar dados do torneio.
- **Adicionar/Importar Jogadores:** Formulários para adicionar jogadores manualmente ou via JSON a este torneio específico.

### 2.9. Lixeira (Seção "Lixeira")

- Lista os torneios com status 'NaLixeira'.
- **Restaurar:** Muda o status do torneio para 'Pendente', retornando-o à lista principal.
- **Excluir Perm.:** Exclui permanentemente o registro do torneio do banco de dados (requer confirmação).
- **Esvaziar Lixeira:** Exclui permanentemente _todos_ os torneios na lixeira.

## 3. Configuração e Administração do Servidor

### 3.1. Persistência de Dados

- O sistema utiliza **exclusivamente SQLite** para armazenar todos os dados (torneios, jogadores, placares, administradores). O arquivo do banco de dados (`lascmmg.sqlite`) está localizado na pasta `data/`.

### 3.2. Administração de Usuários (Admin)

- **Criação do Primeiro Administrador:**
  Use o script `npm run setup-admin` (ou `node scripts/setup-admin-sqlite.js --verbose`) para criar o primeiro usuário administrador. Siga as instruções do prompt.
- **Gerenciamento de Senhas:**
  - Para gerar um novo hash de senha (e opcionalmente atualizar o usuário 'admin'):
    `npm run generate-hash -- --new SuaNovaSenha [--update]`
  - Para verificar uma senha contra o hash armazenado:
    `npm run verify-hash -- --verify SenhaParaTestar`
- **Segurança:**
  - Utilize senhas fortes para contas de administrador.
  - O sistema armazena hashes de senha usando bcrypt.

## 4. Observações Importantes

- **Backups:** É crucial fazer backups regulares do arquivo do banco de dados `data/lascmmg.sqlite`.
- **Segurança em Produção:** Para ambientes de produção, reveja e reforce todas as configurações de segurança, incluindo as definidas no arquivo `.env` (como `COOKIE_SECRET`, `CORS_ORIGIN`), e considere medidas adicionais como HTTPS, firewalls, e monitoramento.

---

Esperamos que este manual ajude você a utilizar o sistema de torneios!
