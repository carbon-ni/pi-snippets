.PHONY: install format format-fix lint test coverage check all hooks

install:
	npm install

format:
	npm run format

format-fix:
	npm run format:fix

lint:
	npm run lint

test:
	npm test

coverage:
	npm run coverage

check:
	npm run check

all:
	npm run all

hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/*
