setup: ci install

ci:
	npm ci

install:
	npm link

test:
	DEBUG=axios,nock.intercept,page-loader npm test 

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
