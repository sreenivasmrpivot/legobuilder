# LegoBuilder

Browser-based 3D LEGO building application — a client-only single-page application (SPA) built with React, TypeScript, Three.js, and Vite.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.x |
| UI Framework | React 18.x |
| Build Tool | Vite 5.x |
| 3D Rendering | Three.js + @react-three/fiber |
| State Management | Zustand + Immer |
| CSS | Tailwind CSS 3.x |
| Persistence | IndexedDB (idb wrapper) |
| Testing | Vitest + React Testing Library + Playwright |
| Linting | ESLint 9.x + Prettier 3.x |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional, for containerized dev)

### Local Development

```bash
# Install dependencies
cd frontend && npm install

# Start dev server (http://localhost:5173)
npm run dev
```

### Using Make

```bash
make install    # Install dependencies
make dev        # Start dev server
make test       # Run unit tests
make lint       # Run linter + type check
make build      # Production build
make e2e        # Run E2E tests
```

### Using Docker

```bash
docker compose up    # Start dev server in container
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── ui/          # 2D UI (Toolbar, BrickPalette, StatusBar)
│   │   └── viewport/    # 3D viewport (Scene, Baseplate, BrickMesh)
│   ├── engine/          # Core domain logic (pure TypeScript)
│   │   ├── brickCatalog.ts
│   │   ├── occupancyMap.ts
│   │   ├── placementEngine.ts
│   │   ├── commands.ts
│   │   ├── selectionManager.ts
│   │   └── exportSchema.ts
│   ├── stores/          # Zustand state stores
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Side-effect services (persistence, export, import)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── tests/
│   ├── unit/            # Vitest unit tests
│   ├── component/       # React Testing Library tests
│   └── e2e/             # Playwright E2E tests
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── eslint.config.js
├── Dockerfile           # Production (multi-stage with nginx)
└── Dockerfile.dev       # Development (Vite dev server)
```

## Architecture

See `docs/` for full architecture documentation:

- [PRD](docs/PRD.md) — Product requirements
- [Test Plan](docs/TEST_PLAN.md) — Test strategy and cases
- [Notional Architecture](docs/NOTIONAL_ARCHITECTURE.md) — System design
- [Tech Stack](docs/tech_stack.yaml) — Technology choices
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) — Implementation design

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest unit + component tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run format` | Format code with Prettier |

## License

MIT
