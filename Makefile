# Variables
PNPM = pnpm
RM   = rm -rf

# Default target
.PHONY: help
help:
	@echo "Relay Desktop Development Commands"
	@echo "================================"
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install    Install dependencies"
	@echo "  dev        Start the development server"
	@echo "  build      Build for production"
	@echo "  lint       Lint the code"
	@echo "  fix        Fix code style errors"
	@echo "  typecheck  Run TypeScript compiler check"
	@echo "  clean      Remove temporary build artifacts"
	@echo "  release    Create a production release"

.PHONY: install
install:
	$(PNPM) install

.PHONY: dev
dev:
	$(PNPM) run dev

.PHONY: build
build:
	$(PNPM) run build

.PHONY: lint
lint:
	$(PNPM) run lint

.PHONY: fix
fix:
	$(PNPM) run lint:fix

.PHONY: typecheck
typecheck:
	$(PNPM) run typecheck

.PHONY: clean
clean:
	$(PNPM) run clean:dev
	$(RM) dist-main dist-preload dist-renderer

.PHONY: release
release:
	$(PNPM) run release
