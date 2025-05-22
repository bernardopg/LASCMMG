# Política de Segurança do LASCMMG

## Versões Suportadas

A seguinte tabela indica quais versões estão atualmente recebendo atualizações de segurança:

| Versão | Suportada          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.5.x   | :white_check_mark: |
| < 1.5   | :x:                |

## Reportando Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança no LASCMMG, por favor envie um e-mail para o administrador do sistema em `admin@lascmmg.org` com os seguintes detalhes:

- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Possível impacto
- Sugestões de mitigação, se houver

Nossa equipe responderá dentro de 48 horas e trabalhará com você para entender e resolver o problema.

## Medidas de Segurança Implementadas

O LASCMMG implementa várias medidas de segurança para proteger os dados dos usuários e a integridade do sistema:

### Autenticação e Controle de Acesso
- Autenticação baseada em JWT com tempos de expiração curtos para tokens de acesso.
- Suporte a Refresh Tokens para gerenciamento de sessão estendida de forma segura.
- Gerenciamento de sessão com timeout por inatividade.
- Armazenamento seguro de senhas utilizando bcrypt.
- Funcionalidade de troca de senha para usuários e administradores.
- Permissões baseadas em funções (RBAC) para proteger endpoints administrativos.
- Bloqueio de contas (baseado em nome de usuário/IP) após múltiplas tentativas de login mal-sucedidas, com contadores armazenados em Redis.

### Proteção contra Ataques Web
- Proteção CSRF
- Validação rigorosa de entrada com Joi
- Sanitização de saída para prevenir XSS
- Headers de segurança configurados (HSTS, X-Content-Type-Options, etc)
- Sistema de honeypot para detecção de bots maliciosos

### Monitoramento e Auditoria
- Registro detalhado de ações administrativas
- Monitoramento de tentativas de acesso suspeitas
- Alertas automáticos para atividades anômalas

### Banco de Dados e Armazenamento
- Banco de dados centralizado com padronização de caminho
- Backups automáticos
- Remoção de códigos e diretórios redundantes
- Soft delete para recuperação de dados acidentalmente excluídos
