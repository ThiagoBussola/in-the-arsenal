# In the Arsenal — Features & Business Rules

Status: [x] Done | [~] Partial | [ ] Not started

---

## 1. Infrastructure & DevOps


| #   | Feature                            | Status | Notes                                                      |
| --- | ---------------------------------- | ------ | ---------------------------------------------------------- |
| 1.1 | Docker Compose (API + PostgreSQL)  | [x]    | `backend/docker-compose.yml`, Postgres 16, volume `pgdata` |
| 1.2 | Multi-stage Dockerfile             | [x]    | Node 22 alpine, builder + production stages                |
| 1.3 | Railway deployment (PORT env)      | [x]    | `next start -p ${PORT:-3000}`, backend `${PORT:-3001}`     |
| 1.4 | Custom domain (GoDaddy to Railway) | [x]    | CNAME + TXT verification configured                        |
| 1.5 | Environment validation (Zod)       | [x]    | `backend/src/config/env.ts`                                |
| 1.6 | CI/CD pipeline                     | [ ]    | No GitHub Actions or Railway auto-deploy config            |
| 1.7 | Staging environment                | [ ]    |                                                            |


## 2. Authentication & Users


| #    | Feature                                   | Status | Notes                                                            |
| ---- | ----------------------------------------- | ------ | ---------------------------------------------------------------- |
| 2.1  | User registration (name, email, password) | [x]    | Zod validation, bcrypt hashing                                   |
| 2.2  | Login (email + password to JWT)           | [x]    | Access token (15min)                                             |
| 2.3  | Refresh token rotation                    | [x]    | 7-day refresh, DB-stored, revokable                              |
| 2.4  | Logout (revoke refresh token)             | [x]    |                                                                  |
| 2.5  | Get current user (`GET /auth/me`)         | [x]    |                                                                  |
| 2.6  | Role-based authorization (ADMIN / USER)   | [x]    | `authorize` middleware exists                                    |
| 2.7  | Email confirmation                        | [~]    | Model field `emailConfirmedAt` exists, auto-confirms on register |
| 2.8  | Password reset flow                       | [ ]    |                                                                  |
| 2.9  | OAuth (Google)                            | [x]    | `POST /auth/google`, `google-auth-library` ID token verification |
| 2.10 | User profile page (frontend)              | [ ]    |                                                                  |


## 3. Blog / Content Engine


| #    | Feature                                     | Status | Notes                                                          |
| ---- | ------------------------------------------- | ------ | -------------------------------------------------------------- |
| 3.1  | Create post (title, slug, content, excerpt) | [x]    | Markdown/HTML TEXT field                                       |
| 3.2  | Update post                                 | [x]    |                                                                |
| 3.3  | Delete post                                 | [x]    |                                                                |
| 3.4  | List posts with filters                     | [x]    | Search, status, category, tags, author, date range, pagination |
| 3.5  | Get post by slug                            | [x]    |                                                                |
| 3.6  | Post status (DRAFT / PUBLISHED)             | [x]    |                                                                |
| 3.7  | Categories                                  | [x]    | Model + repository                                             |
| 3.8  | Tags (many-to-many via PostTag)             | [x]    |                                                                |
| 3.9  | Blog frontend pages (list + detail)         | [x]    | Blog list with search/pagination, post detail with markdown    |
| 3.10 | Markdown editor with live preview           | [x]    | Split panel, formatting toolbar, Write/Preview tabs            |
| 3.11 | Image upload for posts                      | [ ]    | Cover image URL field exists, no file upload                   |


## 4. AI Helper


| #   | Feature                                      | Status | Notes                                              |
| --- | -------------------------------------------- | ------ | -------------------------------------------------- |
| 4.1 | Chat endpoint (`POST /ai/chat`)              | [x]    | OpenRouter API, `stepfun/step-3.5-flash:free`      |
| 4.2 | AI writing assistant in blog editor          | [x]    | Continue writing, improve, generate title, summarize |
| 4.3 | Context-aware FaB responses                  | [ ]    | No system prompt with FaB knowledge                |


## 5. Internationalization (i18n)


| #   | Feature                             | Status | Notes                                    |
| --- | ----------------------------------- | ------ | ---------------------------------------- |
| 5.1 | `next-intl` setup with path prefix  | [x]    | `/pt`, `/en`                             |
| 5.2 | Default locale: Portuguese          | [x]    | `/` redirects to `/pt`                   |
| 5.3 | Language switcher component         | [x]    |                                          |
| 5.4 | Home page translations (PT + EN)    | [x]    |                                          |
| 5.5 | Deck builder translations (PT + EN) | [x]    |                                          |
| 5.6 | Blog page translations (PT + EN)    | [x]    | Blog list, detail, editor, AI assistant  |
| 5.7 | Auth page translations (PT + EN)    | [x]    | Login, register                          |
| 5.8 | Additional locales (ES, etc.)       | [ ]    | Architecture ready                       |


## 6. Deck Builder — Core


| #   | Feature                                              | Status | Notes                                |
| --- | ---------------------------------------------------- | ------ | ------------------------------------ |
| 6.1 | Create deck (name, slug, format, visibility)         | [x]    | Backend + frontend                   |
| 6.2 | Update deck metadata                                 | [x]    |                                      |
| 6.3 | Delete deck                                          | [x]    |                                      |
| 6.4 | List user's own decks                                | [x]    |                                      |
| 6.5 | List public decks (paginated)                        | [x]    |                                      |
| 6.6 | Get deck by ID or slug                               | [x]    | Optional auth for private deck check |
| 6.7 | Deck visibility (PUBLIC / PRIVATE)                   | [x]    |                                      |
| 6.8 | Slug uniqueness enforcement                          | [x]    |                                      |
| 6.9 | Ownership enforcement (only owner or admin can edit) | [x]    |                                      |


## 7. Deck Builder — Card Management


| #   | Feature                                        | Status | Notes                                    |
| --- | ---------------------------------------------- | ------ | ---------------------------------------- |
| 7.1 | Card search (DB + optional goagain fallback)   | [x]    | `GET /api/cards/search`, `CARD_SEARCH_SOURCE` env |
| 7.2 | Card data cached locally (24h TTL)             | [x]    | `card_cache` table, `cachedAt` check     |
| 7.2a | Bulk sync from FabCube `card-flattened.json`  | [x]    | `POST /api/cards/admin/sync-fabcube` (ADMIN), optional `jsonUrl` body or `FABCUBE_CARD_FLATTENED_URL` |
| 7.2b | FaBrary clipboard import                       | [x]    | `POST /api/decks/import/fabrary` + deck builder UI |
| 7.3 | Get single card by unique ID                   | [x]    | Falls back to stale cache if API fails   |
| 7.4 | Add card to deck                               | [x]    | Upserts quantity if card already in deck |
| 7.5 | Remove card from deck                          | [x]    |                                          |
| 7.6 | Replace full card list (bulk)                  | [x]    | `PUT /api/decks/:id/cards`               |
| 7.7 | Card zones: MAIN, EQUIPMENT, WEAPON, SIDEBOARD | [x]    |                                          |
| 7.8 | Quantity tracking (1-3 per card)               | [x]    |                                          |


## 8. Deck Builder — FaB Format Validation

All validation runs via `DeckValidationService` and returns structured error/warning arrays.

### 8.1 Classic Constructed (CC)


| #     | Rule                                                | Status |
| ----- | --------------------------------------------------- | ------ |
| 8.1.1 | Hero must be an adult (non-Young)                   | [x]    |
| 8.1.2 | Minimum 60 cards in main deck                       | [x]    |
| 8.1.3 | Maximum 80 cards total pool                         | [x]    |
| 8.1.4 | Max 3 copies per unique card name                   | [x]    |
| 8.1.5 | Cards must be `cc_legal`                            | [x]    |
| 8.1.6 | Cards must not be `cc_banned`                       | [x]    |
| 8.1.7 | Cards must match hero class/talents or be Generic   | [x]    |
| 8.1.8 | Equipment: max 1 per slot (Head, Chest, Arms, Legs) | [x]    |
| 8.1.9 | Weapons must match hero weapon slots                | [~]    |


> 8.1.9: Validates weapon zone exists, but no hero-specific weapon slot count yet.

### 8.2 Blitz


| #     | Rule                                               | Status |
| ----- | -------------------------------------------------- | ------ |
| 8.2.1 | Hero must be Young                                 | [x]    |
| 8.2.2 | Exactly 40 cards (excluding hero)                  | [x]    |
| 8.2.3 | Max 3 copies per unique card name                  | [x]    |
| 8.2.4 | Cards must be `blitz_legal` and not `blitz_banned` | [x]    |
| 8.2.5 | Class/talent restrictions                          | [x]    |
| 8.2.6 | Equipment slot limits                              | [x]    |


### 8.3 Commoner


| #     | Rule                                                     | Status |
| ----- | -------------------------------------------------------- | ------ |
| 8.3.1 | Hero must be Young                                       | [x]    |
| 8.3.2 | Exactly 40 cards                                         | [x]    |
| 8.3.3 | Cards must be `commoner_legal` and not `commoner_banned` | [x]    |
| 8.3.4 | Only Common/Rare cards allowed                           | [x]    |
| 8.3.5 | Class/talent restrictions                                | [x]    |


### 8.4 Living Legend (LL)


| #     | Rule                                         | Status |
| ----- | -------------------------------------------- | ------ |
| 8.4.1 | Hero must be adult                           | [x]    |
| 8.4.2 | Min 60 cards, max 80 pool                    | [x]    |
| 8.4.3 | Cards must be `ll_legal` and not `ll_banned` | [x]    |
| 8.4.4 | Living Legend heroes allowed                 | [x]    |
| 8.4.5 | Class/talent restrictions                    | [x]    |


### 8.5 SAGE (Silver Age)


| #     | Rule                                                      | Status |
| ----- | --------------------------------------------------------- | ------ |
| 8.5.1 | Hero must be Young                                        | [x]    |
| 8.5.2 | Minimum 40 cards in main deck                             | [x]    |
| 8.5.3 | Maximum 55 cards total pool                               | [x]    |
| 8.5.4 | Max 2 copies per unique card name                         | [x]    |
| 8.5.5 | Cards must be `sage_legal` and not `sage_banned`          | [x]    |
| 8.5.6 | Only Common, Rare, and Basic rarity cards allowed         | [x]    |
| 8.5.7 | One Legendary card allowed (max 1 copy)                   | [x]    |
| 8.5.8 | Class/talent restrictions                                 | [x]    |
| 8.5.9 | Equipment slot limits                                     | [x]    |


## 9. Card Usage Statistics


| #   | Feature                                            | Status | Notes                               |
| --- | -------------------------------------------------- | ------ | ----------------------------------- |
| 9.1 | `card_usage_stats` table (composite PK)            | [x]    |                                     |
| 9.2 | `refreshStats()` SQL aggregation from public decks | [x]    |                                     |
| 9.3 | `getUsageForCard(cardId, hero?, format?)`          | [x]    |                                     |
| 9.4 | `getTopCardsForHero(heroId, format, limit)`        | [x]    |                                     |
| 9.5 | Usage percentage badge on card preview             | [x]    | Frontend `CardUsageBadge` component |
| 9.6 | Periodic auto-refresh of stats (cron / scheduler)  | [ ]    | Must be triggered manually          |


## 10. Deck Builder — Frontend UI


| #     | Feature                                           | Status | Notes                                        |
| ----- | ------------------------------------------------- | ------ | -------------------------------------------- |
| 10.1  | 3-panel layout (hero+equip / search / decklist)   | [x]    |                                              |
| 10.2  | Card search with 300ms debounced autocomplete     | [x]    |                                              |
| 10.3  | Card image preview (enlarged on hover)            | [x]    |                                              |
| 10.4  | Hero selector (search + image display)            | [x]    |                                              |
| 10.5  | Equipment slots (Head/Chest/Arms/Legs) visual     | [x]    |                                              |
| 10.6  | Weapon slots visual                               | [x]    |                                              |
| 10.7  | Deck list with quantity +/- controls              | [x]    |                                              |
| 10.8  | Zone selector per card (Main/Side)                | [x]    |                                              |
| 10.9  | Validation panel with error/warning display       | [x]    |                                              |
| 10.10 | Format selector (CC/Blitz/Commoner/LL/SAGE)       | [x]    | SAGE format added                            |
| 10.11 | Visibility toggle (Public/Private)                | [x]    |                                              |
| 10.12 | Save deck to backend                              | [~]    | Button exists, API wiring not connected      |
| 10.13 | Drag-and-drop between zones                       | [ ]    |                                              |
| 10.14 | Card search filters (type, class, pitch, keyword) | [ ]    | Backend supports it, frontend only sends `q` |
| 10.15 | Pitch dot indicators on card list                 | [x]    | Color-coded (red/yellow/blue)                |


## 11. Deck Viewer & Listing


| #    | Feature                                   | Status | Notes                              |
| ---- | ----------------------------------------- | ------ | ---------------------------------- |
| 11.1 | Public deck viewer page (`/decks/[slug]`) | [x]    | Hero image, card list by zone      |
| 11.2 | My decks list page (`/decks`)             | [x]    | Tabs: public / mine, format filter |
| 11.3 | Shareable deck URL                        | [x]    | Slug-based                         |
| 11.4 | Deck clone/fork                           | [ ]    |                                    |
| 11.5 | Deck export (text / image)                | [ ]    |                                    |


## 12. OpenSearch — Deck Similarity


| #    | Feature                                       | Status | Notes                                    |
| ---- | --------------------------------------------- | ------ | ---------------------------------------- |
| 12.1 | Architecture prepared                         | [x]    | `findSimilar()` stub in `DeckRepository` |
| 12.2 | OpenSearch integration                        | [ ]    | Deferred                                 |
| 12.3 | Similar decks recommendation UI               | [ ]    |                                          |
| 12.4 | Cosine similarity on card composition vectors | [ ]    |                                          |


## 13. Testing


| #    | Feature                                 | Status | Notes |
| ---- | --------------------------------------- | ------ | ----- |
| 13.1 | Unit tests (JWT, bcrypt)                | [x]    | Poku  |
| 13.2 | Integration tests (auth routes, health) | [x]    | Poku  |
| 13.3 | Deck builder service tests              | [ ]    |       |
| 13.4 | Card service tests                      | [ ]    |       |
| 13.5 | Validation service tests                | [ ]    |       |
| 13.6 | Frontend tests (React Testing Library)  | [ ]    |       |
| 13.7 | E2E tests (Playwright/Cypress)          | [ ]    |       |


## 14. API Documentation


| #    | Feature                | Status | Notes                                         |
| ---- | ---------------------- | ------ | --------------------------------------------- |
| 14.1 | Insomnia collection    | [x]    | `backend/insomnia_v2026.json` — all endpoints |
| 14.2 | OpenAPI / Swagger spec | [ ]    |                                               |


## 15. Frontend — General


| #    | Feature                                          | Status | Notes                                              |
| ---- | ------------------------------------------------ | ------ | -------------------------------------------------- |
| 15.1 | Home page (hero, about, pillars, teaser, footer) | [x]    | Dark fantasy FaB aesthetic                         |
| 15.2 | Navigation bar with language switcher            | [x]    |                                                    |
| 15.3 | Responsive design                                | [~]    | Home page responsive, deck builder desktop-focused |
| 15.4 | Login / Register pages                           | [x]    | Email/password + Google OAuth sign-in              |
| 15.5 | User profile / settings                          | [ ]    |                                                    |
| 15.6 | Protected route wrapper (auth guard)             | [~]    | Editor page checks auth, no global wrapper         |
| 15.7 | Global toast / notification system               | [ ]    |                                                    |
| 15.8 | SEO metadata per page                            | [~]    | Home page only                                     |

