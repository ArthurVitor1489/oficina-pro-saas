# OficinaPro - SaaS Multi-Tenant para Oficinas Mecânicas & Centros Automotivos

Plataforma comercial **Multi-Tenant** desenvolvida para gestão de oficinas mecânicas, centros automotivos, oficinas diesel, elétrica, suspensão, freios e troca de óleo.

Construído com arquitetura **Serverless** otimizada para baixo custo operacional, segurança estrita de isolamento entre empresas, integridade contábil e experiência mobile-first para o mecânico no box.

---

## 🛠️ Stack Tecnológica

- **Frontend & Backend:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Mobile-First, PWA-Ready)
- **Banco de Dados:** [Turso](https://turso.tech/) (libSQL / SQLite Serverless)
- **ORM & Migrações:** [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit
- **Segurança & Criptografia:** `bcryptjs` (salt rounds 12), sessões `HttpOnly` / `SameSite=Lax`, Rate Limiter deslizante
- **Deploy:** 100% compatível com ambiente Serverless da [Vercel](https://vercel.com/)

---

## 🔒 Princípios de Segurança & Multi-Tenancy

1. **Isolamento Estrito no Servidor:** O frontend **nunca** define ou envia `company_id`. A empresa é resolvida no servidor exclusivamente a partir da sessão autenticada (`src/lib/server/tenant-context.ts`).
2. **Controle de Acesso Baseado em Funções (RBAC):**
   - `OWNER`: Proprietário da oficina (acesso total)
   - `ADMIN`: Administrador geral
   - `MANAGER`: Gerente operacional
   - `ATTENDANT`: Atendimento e balcão
   - `MECHANIC`: Mecânico / Técnico (visão mobile no box)
   - `FINANCE`: Gestão financeira e conciliação
3. **Trilha de Auditoria Imutável (`audit_logs`):** Gravação de logs com IP, User-Agent, dados anteriores e novos em ações críticas.
4. **Precisão Contábil:** Todos os valores financeiros são armazenados em centavos inteiros (`amount_cents`, `price_cents`), eliminando discrepâncias de ponto flutuante em SQLite.

---

## 📁 Estrutura do Projeto

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Tela de login com preenchimento rápido para demonstração
│   │   └── register/       # Cadastro de novas oficinas e primeiro usuário OWNER
│   ├── dashboard/          # Layout autenticado com drawer mobile e bottom navigation
│   │   ├── audit/          # Trilha de auditoria e conformidade
│   │   ├── customers/      # Gestão de clientes
│   │   ├── finance/        # Contas a pagar/receber e fluxo de caixa
│   │   ├── inventory/      # Peças, estoque mínimo e saldo
│   │   ├── purchases/      # Compras e entrada de notas
│   │   ├── quotes/         # Orçamentos comerciais
│   │   ├── services/       # Catálogo de serviços e tempos padrão
│   │   ├── team/           # Gestão de colaboradores e permissões RBAC
│   │   ├── vehicles/       # Frota e veículos dos clientes
│   │   └── work-orders/    # Ordens de serviço operacionais
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                 # Componentes reutilizáveis (Button, Card, Input, Badge, Modal)
├── db/
│   ├── migrations/         # Arquivos de migração SQL gerados pelo Drizzle
│   ├── schema/             # Modelagem das 18 tabelas libSQL/SQLite
│   ├── index.ts            # Conexão libSQL Client + Drizzle ORM
│   ├── migrate.ts          # Executor de migrações
│   └── seed.ts             # Dados de teste com 2 oficinas isoladas
├── features/
│   ├── auth/               # Server actions de login, registro e logout
│   └── team/               # Server actions para convite e RBAC
├── lib/
│   └── server/             # Contexto de tenant, auditoria, RBAC, criptografia e rate limit
scripts/
└── test-isolation.ts       # Suíte de testes automatizados de isolamento multi-tenant
```

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório e instalar dependências
```bash
git clone <url-do-repositorio>
cd oficina-pro-saas
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```
*(Por padrão, utiliza `file:local.db` para desenvolvimento local offline rápido sem necessidade de internet)*.

### 3. Aplicar migrações do banco de dados
```bash
npm run db:migrate
```

### 4. Popular com dados de demonstração (Seed)
```bash
npm run db:seed
```

### 5. Executar os testes automatizados de isolamento multi-tenant
```bash
npm run test:multi-tenant
```

### 6. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Usuários para Testes Rápidos (Seed)

### Oficina 1: AutoCenter Pro
- **Proprietário:** `carlos@autocenter.com` | `senha123456`
- **Mecânico:** `marcos@autocenter.com` | `senha123456`
- **Atendente:** `juliana@autocenter.com` | `senha123456`
- **Financeiro:** `roberto@autocenter.com` | `senha123456`

### Oficina 2: Oficina do Silva (Tenant Isolado)
- **Proprietário:** `joao@oficinadasilva.com` | `senha123456`

*(A tela de login possui atalhos de 1 clique para preenchimento imediato de cada um desses perfis)*.

---

## ☁️ Deploy na Vercel

1. Crie uma database no [Turso](https://turso.tech/):
   ```bash
   turso db create oficinapro-db
   turso db show oficinapro-db --url
   turso db tokens create oficinapro-db
   ```
2. Na Vercel, configure as Environment Variables do projeto:
   - `DATABASE_URL`: `libsql://oficinapro-db-[seu-usuario].turso.io`
   - `TURSO_AUTH_TOKEN`: `[seu-token-do-turso]`
   - `AUTH_SECRET`: `[chave-secreta-aleatoria-min-32-chars]`
   - `NEXT_PUBLIC_APP_URL`: `https://sua-oficina.vercel.app`
3. Execute o Deploy!

---

## 📄 Licença

Proprietário / Comercial. Todos os direitos reservados.
