# Deploy no Railway (monorepo: Next + Express + Postgres)

Este repo tem **duas aplicações** na mesma raiz Git:

| Pasta        | O quê              | Porta típica |
|-------------|---------------------|--------------|
| `/` (raiz)  | Next.js (site)      | `PORT` (Railway define, ex. 8080) |
| `/backend`  | Express (API REST)  | `PORT` (ex. da Railway) |

O **Postgres** é um **plugin/recurso** no projeto; a API liga-se com `DATABASE_URL`.

---

## 1. Visão geral (o que cada um faz)

```
Utilizador  →  https://www.inthearsenal.com     →  Serviço **Web** (Next)
                    │
                    │  fetch /api/* (mesma origem)
                    ▼
               Next faz **proxy** para o Express

Next (servidor)  →  API_SERVER_URL  →  https://api.inthearsenal.com  →  Serviço **API**
                                                                              │
                                                                              ▼
                                                                        Postgres (DATABASE_URL)
```

- O **browser** só fala com `www` (Next). Não precisa de CORS para o Express se usares o proxy `/api`.
- O **Next no servidor** precisa de saber o URL **público HTTPS** da API → variável `API_SERVER_URL` (ou `BACKEND_URL`).

**Erro comum:** colocar o domínio `www` no serviço da API. O `www` deve estar no serviço **Web (Next)**. A API deve ter domínio tipo **`api.inthearsenal.com`** (ou só o URL `*.up.railway.app` enquanto testas).

---

## 2. Postgres

1. No **projeto** Railway: **New** → **Database** → **PostgreSQL**.
2. Quando estiver **Online**, abre o card do **Postgres** → **Variables** (ou **Connect**).
3. No serviço **API** (`in-the-arsenal-api`):

   - **Variables** → **Add variable** → **Reference** (se disponível) → escolhe o Postgres → **`DATABASE_URL`**.

   Assim o valor é sempre o correto e sincronizado.

4. Confirma que **não** tens um `DATABASE_URL` “à mão” errado ou vazio. Tem de ser o que o Railway gera para esse Postgres.

---

## 3. Serviço da API (`/backend`)

### 3.1 Repositório, Root Directory, Docker e comandos

1. **Source:** GitHub → repo `in-the-arsenal`.
2. **Settings** → **Root Directory:** `backend` (sem barra inicial ou com `/backend`, conforme a UI aceitar — o teu print já mostra `/backend`, está certo).
3. **Onde está o Dockerfile na Railway**  
   O campo **não** fica ao lado do Root Directory. Na mesma página **Settings**, **faz scroll para baixo** até à secção **Build**:
   - No cartão do builder (por defeito aparece **Railpack** com Node), abre o **menu/dropdown** e escolhe **`Dockerfile`** (ou **Docker**).
   - **Dockerfile path:** com Root Directory `backend`, usa só **`Dockerfile`** (relativo a essa pasta, **não** `backend/Dockerfile`).
   - **Custom Build Command** (ex.: `npm run build`): **apaga** — com Docker o build é o do `Dockerfile`.

   Se não vês secção Build: abre o filtro “Filter Settings…” e procura **build** / **docker**, ou confirma que não estás só na metade superior da página.

4. **Watch Paths** (opcional, monorepo): no serviço da API, padrão tipo **`/backend/**`** para só redeployar quando mudar código dentro de `backend`.

### 3.2 Apago Build Command / Start Command que já existiam?

- Se estavas a usar **Railpack** / **Nixpacks** antes e passaste a **Dockerfile**:
  - **Custom Build Command** (tipo `npm install`, `npm run build`): **podes apagar / deixar vazio.** O build passa a ser só `docker build` com o teu `backend/Dockerfile`.
  - **Start Command** / **Deploy → Custom Start Command:** **deixa vazio** para o Railway usar o **`CMD`** do Dockerfile (`node dist/server.js`). Só preenche se quiseres **substituir** o CMD (não é necessário aqui).

- **Release Command** (migrações) é **outra coisa**: não apagues se quiseres migrações automáticas. Valor: `npm run db:migrate`  
  (ou confia no `backend/railway.toml`, se o projeto o estiver a ler.)

Resumo: com **Dockerfile**, não uses em paralelo comandos de build estilo Nixpacks; start vem do Docker **a não ser** que tenhas override explícito.

### 3.3 `railway.toml` (opcional)

O ficheiro `backend/railway.toml` pode definir:

- **`releaseCommand`:** `npm run db:migrate`
- **`startCommand`:** `node dist/server.js`

Se o dashboard da Railway **não** mostrar **Release Command**, define-a aí manualmente. O **start** duplicado no `railway.toml` e no Dockerfile é redundante — basta um dos lados estar correcto.

### 3.4 Variáveis obrigatórias (API)

| Variável | Notas |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Referência ao Postgres (passo 2) |
| `JWT_SECRET` | ≥ 16 caracteres |
| `JWT_REFRESH_SECRET` | ≥ 16 caracteres, diferente |
| `PORT` | Normalmente a Railway injeta; não forces outro valor sem necessidade |

Opcionais (já tens algumas): `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `GOOGLE_CLIENT_ID`, `OPENROUTER_API_KEY`, `EMAIL_ENABLED`, `FABCUBE_CARD_FLATTENED_URL`, etc.

### 3.5 Domínio da API

- **Settings** → **Networking** → **Custom Domain**
- Adiciona por exemplo: **`api.inthearsenal.com`**
- No teu DNS (Cloudflare, Registro.br, etc.): registo **`api`** → **CNAME** para o *target* que a Railway mostrar (tipo `xxxx.up.railway.app`).

**Remove** ou **não uses** `www.inthearsenal.com` neste serviço — esse domínio fica para o Next.

Podes deixar só o URL público Railway (`https://in-the-arsenal-api-production.up.railway.app` ou similar) enquanto não configurares `api.`; nesse caso `API_SERVER_URL` no front é esse URL **https completo, sem path `/api`**.

---

## 4. Serviço do front (Next) — **criar novo serviço**

1. No mesmo **projeto**: **New** → **GitHub Repo** → escolhe o **mesmo** repositório.
2. **Settings** → **Root Directory:** deixa **vazio** ou `.` (raiz do repo, **não** `backend`).
3. A Railway costuma detetar **Nixpacks** para Node. Se precisares de comandos explícitos:

   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`  
     (o `package.json` na raiz já usa `next start -p ${PORT:-3000}` — na Railway o `PORT` vem definido.)

4. **Variáveis** do serviço **Web**:

| Variável | Obrigatório? | Valor |
|----------|----------------|--------|
| `NODE_ENV` | Sim | `production` |
| `API_SERVER_URL` | **Sim** | URL **HTTPS** da API, ex. `https://api.inthearsenal.com` **ou** o URL `https://….up.railway.app` **sem** `/api` no fim |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Se usares Google no login | Igual ao Google Cloud |

**Não** precisas de `DATABASE_URL` no Next.

5. **Domínio do site**

   - **Custom Domain:** **`www.inthearsenal.com`** (e opcionalmente `inthearsenal.com` com redirect para `www`).
   - DNS: **`www`** → CNAME para o hostname que a Railway indicar para **este** serviço (é diferente do da API).

---

## 5. Checklist rápido

- [ ] Postgres Online; `DATABASE_URL` referenciada no serviço **API**
- [ ] API: Root `backend`, Docker, `JWT_*`, `NODE_ENV=production`
- [ ] API: domínio **`api.…`** ou URL Railway; **sem** `www` na API
- [ ] Web: raiz do repo, `npm run build` / `npm start`
- [ ] Web: **`API_SERVER_URL`** = URL público da API (https)
- [ ] Web: domínio **`www.…`**
- [ ] Deploy da API: ver logs da fase **Release** com migrações OK
- [ ] Abrir `https://www…/pt/auth/register` e testar cadastro

---

## 6. Migrações em produção

### Automático (recomendado)

Com `backend/railway.toml` e **Release Command** ativo, cada deploy da API corre:

```bash
npm run db:migrate
```

Antes do `node dist/server.js`. Usa `DATABASE_URL` e, em produção, o `sequelize.config.cjs` já pede **SSL** ao Postgres da Railway.

Requisitos:

- `NODE_ENV=production` (ou ambiente em que o Sequelize use o bloco `production` com SSL).
- `DATABASE_URL` correto.

### Manual (primeira vez ou se o release falhar)

Na tua máquina (ou num shell temporário com as mesmas envs):

```bash
cd backend
export DATABASE_URL="postgresql://..."   # copiar do Railway (variável do Postgres)
export NODE_ENV=production
npx sequelize-cli db:migrate
```

Ou: Railway **API service** → abre **shell** / one-off se existir, com `DATABASE_URL` já injectado, e corre `npm run db:migrate` dentro de `/app` (caminho depende da imagem).

### Se o release falhar

- Lê o log da fase **Release** (não só o do container final).
- Erros típicos: `DATABASE_URL` ausente, SSL, ou migração já aplicada / conflito.

---

## 7. Ficheiros de referência no repo

- `railway.env.template` — lista de variáveis por serviço (comentada).
- `backend/railway.toml` — release + start da API.
- `backend/Dockerfile` — inclui `src/migrations` para o `db:migrate` na imagem.

---

## 8. Resumo de subdomínios (DNS)

| Registo | Aponta para | Serviço Railway |
|---------|-------------|------------------|
| `www`   | CNAME → (hostname do **Web**) | Next |
| `api`   | CNAME → (hostname da **API**) | Express |
| `@` (root) | opcional: redirect para `www` | — |

Cada serviço na Railway mostra o **hostname** exato ao adicionares o custom domain.
