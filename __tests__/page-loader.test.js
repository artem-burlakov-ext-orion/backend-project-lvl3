import fs from 'fs';
import os from 'os';
import nock from 'nock';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pageLoader from '../src/index';

const { promises: fsp } = fs;

nock.disableNetConnect();

let output;
let beforeParsingHtml;
let afterParsingHtml;

const isFileExist = (filePath) => fsp.access(filePath).then(() => true).catch(() => false);
const getPath = (name) => join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__', name);

const before = getPath('before');
const after = getPath('after');
const fullUrl = 'https://ru.hexlet.io/courses';
const baseUrl = 'https://ru.hexlet.io';
const resourcesDirPath = 'ru-hexlet-io-courses_files';
const resources = {
  css: join(resourcesDirPath, 'ru-hexlet-io-assets-application.css'),
  js: join(resourcesDirPath, 'ru-hexlet-io-packs-js-runtime.js'),
  png: join(resourcesDirPath, 'ru-hexlet-io-assets-professions-nodejs.png'),
};
const getResource = async (filePath) => {
  const content = await fsp.readFile(join(after, filePath), 'utf8');
  return content;
};

beforeAll(async () => {
  beforeParsingHtml = await fsp.readFile(join(before, 'before.html'), 'utf8');
  afterParsingHtml = await fsp.readFile(join(after, 'ru-hexlet-io-courses.html'), 'utf8');

  nock(baseUrl)
    .persist()
    .get('/courses')
    .reply(200, beforeParsingHtml)
    .get('/assets/application.css')
    .reply(200, async () => {
      const content = await getResource(resources.css);
      return content;
    })
    .get('/packs/js/runtime.js')
    .reply(200, async () => {
      const content = await getResource(resources.js);
      return content;
    })
    .get('/assets/professions/nodejs.png')
    .reply(200, async () => {
      const content = await getResource(resources.png);
      return content;
    });
});

beforeEach(async () => {
  output = await fsp.mkdtemp(join(os.tmpdir(), 'page-loader-'));
});

describe('get response with mock, parse it and return correct html', () => {
  test('should create сorrect html file name', async () => {
    await pageLoader(fullUrl, output);
    const htmlPath = join(output, 'ru-hexlet-io-courses.html');
    await expect(isFileExist(htmlPath)).resolves.toBe(true);
  });
  test('should return сorrect html content', async () => {
    await pageLoader(fullUrl, output);
    const html = join(output, 'ru-hexlet-io-courses.html');
    expect(await fsp.readFile(html, 'utf-8')).toBe(afterParsingHtml);
  });
  test.each(Object.values(resources))('%s', async (path) => {
    const outputFullPath = join(output, path);
    await pageLoader(fullUrl, output);
    const expected = await getResource(path);
    await expect(fsp.readFile(outputFullPath, 'utf8')).resolves.toBe(expected);
  });
});

describe('correct error handling', () => {
  test('should throw because bad url', async () => {
    const invalidRelativeUrl = '/cat-poems';
    const invalidFullUrl = `${baseUrl}${invalidRelativeUrl}`;
    const expected = `getaddrinfo ENOTFOUND ${invalidFullUrl}`;
    nock(baseUrl).get(invalidRelativeUrl).replyWithError(expected);
    await expect(pageLoader(invalidFullUrl, output)).rejects.toThrow(expected);
  });
  test('should throw because output not exists', async () => {
    const notExistsOutput = getPath('notExistsOutput');
    const fullResourcesDirPath = join(notExistsOutput, resourcesDirPath);
    const expected = `ENOENT: no such file or directory, mkdir '${fullResourcesDirPath}'`;
    await expect(pageLoader(fullUrl, notExistsOutput)).rejects.toThrow(expected);
  });
  test('should throw because permission denied', async () => {
    const withoutPermissonOutput = '/bin';
    const fullResourcesDirPath = join(withoutPermissonOutput, resourcesDirPath);
    const expected = `EACCES: permission denied, mkdir '${fullResourcesDirPath}`;
    await expect(pageLoader(fullUrl, withoutPermissonOutput)).rejects.toThrow(expected);
  });
});
