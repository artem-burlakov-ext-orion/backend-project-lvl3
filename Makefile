ci:
	npm ci

install:
	ci
	publish
	npm link

test:
	DEBUG=axios,nock,page-loader npm test 

test-watch:
	npm test -- --watch

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

fix:
	npx eslint --fix .

publish:
	npm publish --dry-run

.PHONY: test