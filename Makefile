.PHONY: dev build test lint format type-check clean install

# --- Development ---
dev:
	cd frontend && npm run dev

dev-docker:
	docker compose up --build

# --- Build ---
build:
	cd frontend && npm run build

build-docker:
	docker build -t legobuilder ./frontend

# --- Testing ---
test:
	cd frontend && npm run test

test-watch:
	cd frontend && npm run test:watch

test-coverage:
	cd frontend && npm run test:coverage

test-e2e:
	cd frontend && npm run test:e2e

# --- Code Quality ---
lint:
	cd frontend && npm run lint

lint-fix:
	cd frontend && npm run lint:fix

format:
	cd frontend && npm run format

format-check:
	cd frontend && npm run format:check

type-check:
	cd frontend && npm run type-check

# --- Setup ---
install:
	cd frontend && npm install

# --- Cleanup ---
clean:
	cd frontend && rm -rf dist node_modules .vitest
	docker compose down --rmi local 2>/dev/null || true
