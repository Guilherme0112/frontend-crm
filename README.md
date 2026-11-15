# Vértice CRM — Frontend (React + TypeScript + Vite)

Interface web multi-tenant em português (pt-BR) integrada à API REST do CRM (Laravel 12 + Sanctum).

## Requisitos

- Node.js 18+
- API Backend rodando (padrão: `http://localhost:8000/api/v1`)

## Configuração e execução

1. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Ajuste `VITE_API_URL` no `.env` caso sua API não esteja em `http://localhost:8000/api/v1`.
3. Instale as dependências e inicie o servidor de desenvolvimento:
   ```bash
   npm install && npm run dev
   ```
4. Build de produção:
   ```bash
   npm run build
   ```

## Credenciais de demonstração

Caso o backend tenha sido populado com o seeder padrão ("Acme Corp"):

- **E-mail:** `admin@example.com`
- **Senha:** `password`

## Funcionalidades integradas

- **Autenticação Sanctum**: Login, cadastro de nova empresa + usuário, hidratação via `GET /auth/me`, logout e redirecionamento automático em `401`.
- **Dashboard**: Visão geral em tempo real com contagens de leads, pipelines, faturas em aberto e assinatura ativa.
- **Pipelines (CRMs) & Kanban**: CRUD completo de CRMs (com cópia de token), gestão de etapas ordenadas por `position`, quadro Kanban com drag-and-drop HTML5 (`PATCH /leads/{id}/step`) com atualização otimista e rollback, busca por nome/e-mail e criação inline de leads.
- **Detalhes do Lead**: Drawer e rota dedicada (`/leads/:id`) com edição completa e exclusão.
- **Templates de Envio & Grupos**: CRUD de templates com pré-visualização em tempo real de variáveis `{{variavel}}` e vinculação a grupos.
- **Faturamento & Faturas**: Listagem de planos, criação/cancelamento de assinatura (com tratamento de conflito `409`), quitação de faturas (`PATCH /invoices/{id}/pay`) e gerenciamento de métodos de pagamento (cartão, Pix, boleto e padrão).
- **Empresa, Equipe & Perfil**: Edição de dados e endereço da empresa, CRUD de membros com alternância de status `is_active` e proteção contra autoexclusão (`422`), além de alternância de tema claro/escuro persistida em `localStorage`.
