# Minha Plataforma — WhatsApp SaaS

## Início rápido

### 1. Suba o banco de dados e Redis
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # edite as variáveis
npx prisma migrate dev --name init
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## Variáveis de ambiente (backend/.env)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_SECRET` | Segredo para assinar tokens JWT |
| `UAZAPI_BASE_URL` | URL base da API uazapi |
| `UAZAPI_TOKEN` | Token de autenticação uazapi |
| `PORT` | Porta do servidor (padrão: 3001) |
| `FRONTEND_URL` | URL do frontend para CORS |

## Estrutura

```
minha-plataforma/
├── backend/
│   ├── src/
│   │   ├── server.js          # Entry point Express + Socket.IO
│   │   ├── middleware/auth.js  # JWT middleware
│   │   └── routes/
│   │       ├── auth.js        # Login / registro
│   │       ├── connections.js  # CRUD instâncias WhatsApp
│   │       ├── webhooks.js    # Eventos uazapi
│   │       ├── contacts.js    # CRUD contatos
│   │       └── messages.js    # Enviar/listar mensagens
│   └── prisma/schema.prisma   # Models: Company, User, Connection, Contact, Message, Flow
├── frontend/
│   ├── app/
│   │   ├── login/             # Tela de login/registro
│   │   └── dashboard/
│   │       ├── page.tsx       # Cards de resumo
│   │       ├── connections/   # Gestão de instâncias
│   │       ├── contacts/      # Lista de contatos
│   │       └── chats/         # Chat ao vivo com Socket.IO
│   ├── components/
│   │   ├── Sidebar.tsx        # Menu lateral escuro
│   │   └── ConnectionCard.tsx # Linha de tabela de conexões
│   └── lib/api.ts             # Axios configurado com auth
└── docker-compose.yml          # PostgreSQL 15 + Redis
```
