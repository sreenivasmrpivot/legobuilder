.PHONY: help dev install test lint typecheck build docker-build docker-run clean

help:
	@echo "LegoBuilder Commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Start dev server"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linter"
	@echo "  make typecheck     - Type check"
	@echo "  make build         - Production build"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run Docker container"
	@echo "  make k8s-deploy    - Deploy to KIND"

dev:
	cd frontend && npm run dev

install:
	cd frontend && npm install

test:
	cd frontend && npm test

lint:
	cd frontend && npm run lint

typecheck:
	cd frontend && npm run typecheck

build:
	cd frontend && npm run build

docker-build:
	docker build -t legobuilder:latest ./frontend

docker-run:
	docker run -p 3000:80 legobuilder:latest

docker-compose-up:
	docker compose up --build

k8s-deploy: docker-build
	kind load docker-image legobuilder:latest
	kubectl apply -f k8s/deployment.yaml

clean:
	rm -rf frontend/dist frontend/node_modules
