# Manual do Usuário - Sistema de Gerenciamento de Torneios de Sinuca LASCMMG

## Introdução

Bem-vindo ao Sistema de Gerenciamento de Torneios de Sinuca da LASCMMG! Este manual guiará você através das funcionalidades disponíveis tanto para visualização pública quanto para administração dos torneios. O sistema utiliza um banco de dados SQLite para armazenar todas as informações.

## 1. Visualização Pública (`index.html`)

Esta é a página principal onde qualquer pessoa pode visualizar o andamento dos torneios.

### 1.1. Selecionar um Torneio

- No topo da página, um menu suspenso (dropdown) lista os torneios disponíveis, ordenados por data.
- Selecione um torneio para visualizar seus detalhes (chaveamento e placares).
- A URL é atualizada para permitir o compartilhamento de links diretos para o torneio selecionado.

### 1.2. Navegação (Barra Lateral Esquerda)

- **Início:** Retorna à página inicial.
- **Chaveamento:** Exibe a estrutura de partidas do torneio.
- **Histórico de Placares:** Tabela com placares registrados, ordenável e filtrável.
- **Adicionar Placar:** (Visível para administradores logados) Permite registrar resultados.
- **Estatísticas:** Exibe estatísticas do torneio.
- **Login Admin / Voltar para Admin:** Alterna o link dependendo do status de login.

### 1.3. Menu de Perfil (Canto Superior Direito)

- Ícone de perfil para acesso à "Área Admin" ou "Sair (Admin)".

### 1.4. Alternador de Tema

- Botão para alternar entre os temas Claro e Escuro. A preferência é salva localmente e respeita a configuração do sistema operacional na primeira visita.

## 2. Painel Administrativo (`admin.html`)

Requer login para acesso.

### 2.1. Login e Logout

- **Login:** Acesse `admin.html`, insira credenciais e clique em "Entrar".
- **Logout:** Via botão "Sair" na barra lateral ou no menu de perfil.

### 2.2. Navegação (Barra Lateral Esquerda - Admin)

- **Painel Administrativo:** Dashboard com resumos e estatísticas.
- **Torneios:** Gerenciar e criar torneios.
- **Agendamento:** Definir/alterar data/hora de partidas.
- **Placares:** Adicionar/editar placares.
- **Jogadores:** Gerenciar jogadores do torneio (adicionar, editar, excluir, importar).
- **Lixeira:** Visualizar torneios cancelados, restaurar ou excluir permanentemente.
- **Segurança:** Link para `admin-security.html` (estatísticas de honeypot, etc.).
- **Voltar ao Torneio:** Retorna à `index.html`.

### 2.3. Selecionar Torneio Ativo (Admin)

- Menu suspenso para selecionar o torneio a ser administrado.
- Apenas torneios não cancelados aparecem. Botão "Atualizar" recarrega a lista.

### 2.4. Gerenciamento de Torneios (Seção "Torneios")

- **Criar Novo Torneio:**
  - Campos: Nome, data, descrição, nº esperado de jogadores, tipo de chaveamento, taxa de inscrição, premiação, regras.
  - Clique em "Criar Torneio".
- **Torneios Existentes:**
  - Tabela lista torneios ativos.
  - **Selecionar:** Define o torneio ativo para administração.
  - **Visualizar:** Abre a página pública do torneio.
  - **Mover para Lixeira:** Altera o status do torneio para 'Cancelado'.
- **Detalhes do Torneio Selecionado:**
  - Edite Nome, Descrição, Status, Taxa de Inscrição, Premiação, Regras.
  - Data e Tipo de Chaveamento são apenas para visualização após criação.
  - "Salvar Alterações" persiste as mudanças.

### 2.5. Agendamento de Partidas (Seção "Agendamento")

- Requer um torneio selecionado.
- Selecione uma partida pendente e defina nova data/hora.

### 2.6. Gerenciamento de Placares (Seção "Placares")

- Requer um torneio selecionado.
- **Adicionar/Editar Placar:** Selecione a partida, insira placares, opcionalmente ajuste data/hora.
- **Histórico de Placares:** Lista placares com opções de edição/exclusão.

### 2.7. Gerenciamento de Jogadores (Seção "Jogadores")

- Requer um torneio selecionado.
- **Adicionar Jogador:** Insira nome, apelido, gênero (opcional), nível de habilidade (opcional).
- **Lista de Jogadores:** Edite ou exclua jogadores.
- **Importar JSON:** Adicione/atualize jogadores em massa.
- **Exportar Jogadores:** Baixa um JSON com os jogadores do torneio.

### 2.8. Gerenciamento do Torneio Selecionado (Seção "Torneio")

(Esta seção parece ter sido integrada/substituída pelas outras seções mais específicas no painel admin atual. As funcionalidades como "Gerar Chaveamento", "Reiniciar Torneio" e "Exportar Dados" estão disponíveis nas respectivas seções ou diretamente na lista de torneios.)

### 2.9. Lixeira (Seção "Lixeira")

- Lista torneios com status 'Cancelado'.
- **Restaurar:** Muda status para 'Pendente'.
- **Excluir Perm.:** Exclui permanentemente (requer confirmação).
- **Esvaziar Lixeira:** Exclui permanentemente todos os torneios cancelados.

## 3. Configuração e Administração do Servidor

### 3.1. Persistência de Dados

- O sistema utiliza SQLite. O arquivo do banco de dados é `data/data.db`.

### 3.2. Administração de Usuários (Admin)

- **Criação do Primeiro Administrador:**
  Use o script: `node scripts/initialize_admin.js --username seu_usuario --password sua_senha_forte`
- **Gerenciamento de Senhas:**
  - O sistema de gerenciamento de senhas via scripts como `generate_admin_hash.js` pode ter sido substituído pela funcionalidade de "Alterar Senha" no painel de autenticação (`/api/auth/change-password`). Verifique a documentação de implantação (`DEPLOYMENT.md`) para os métodos atuais de gerenciamento de credenciais.
- **Segurança:**
  - Utilize senhas fortes.
  - O sistema armazena hashes de senha usando bcrypt.

## 4. Observações Importantes

- **Backups:** Faça backups regulares do arquivo `data/data.db`. Um script `scripts/backup-database.js` está disponível.
- **Segurança em Produção:** Reforce as configurações de segurança (variáveis de ambiente, HTTPS, firewalls).

---

Esperamos que este manual ajude você a utilizar o sistema de torneios!
