# LegoBuilder

Browser-based 3D LEGO building application with snap-to-grid placement, undo/redo, and local persistence.

## Tech Stack

- React 18 + TypeScript 5 + Vite 5
- Three.js via @react-three/fiber
- Zustand + Immer for state management
- Tailwind CSS for styling
- IndexedDB (via idb) for local persistence
- Vitest + React Testing Library + Playwright for testing

## Quick Start

```bash
make install    # Install dependencies
make dev        # Start dev server (http://localhost:3000)
make test       # Run tests
make lint       # Lint code
make build      # Build for production
```

## Docker

```bash
make docker-build
make docker-run     # http://localhost:3000
```

## KIND Deployment

```bash
make k8s-deploy     # http://localhost:30500
```
