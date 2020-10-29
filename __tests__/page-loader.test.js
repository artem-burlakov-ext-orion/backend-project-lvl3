import fs from 'fs';
import os from 'os';
import nock from 'nock';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pageLoader from '../src/index';

const { promises: fsp } = fs;

nock.disableNetConnect();

let getResourceFullPath;
let fullUrl;
let baseUrl;
let resourcesDirPath;
let expectedResources;
let output;
let beforeParsingHtml;
let afterParsingHtml;
let css;
let js;
let png;
let before;
let after;
let resourcesOutputDirFullPath;

const isFileExist = (filePath) => fsp.access(filePath).then(() => true).catch(() => false);
const getPath = (name) => join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__', name);

beforeAll(async () => {
  before = getPath('before');
  after = getPath('after');
  fullUrl = 'https://ru.hexlet.io/courses';
  baseUrl = 'https://ru.hexlet.io';
  resourcesDirPath = 'ru-hexlet-io-courses_files';
  expectedResources = await fsp.readdir(join(after, resourcesDirPath));
  getResourceFullPath = (fileName) => join(after, resourcesDirPath, fileName);
  beforeParsingHtml = await fsp.readFile(join(before, 'before.html'), 'utf8');
  afterParsingHtml = await fsp.readFile(join(after, 'ru-hexlet-io-courses.html'), 'utf8');
  css = await fsp.readFile(getResourceFullPath('ru-hexlet-io-assets-application.css'), 'utf8');
  js = await fsp.readFile(getResourceFullPath('ru-hexlet-io-packs-js-runtime.js'), 'utf8');
  png = await fsp.readFile(getResourceFullPath('ru-hexlet-io-assets-professions-nodejs.png'), 'utf8');
  nock(baseUrl)
    .persist()
    .get('/courses')
    .reply(200, beforeParsingHtml)
    .get('/assets/application.css')
    .reply(200, css)
    .get('/packs/js/runtime.js')
    .reply(200, js)
    .get('/assets/professions/nodejs.png')
    .reply(200, png);
});

beforeEach(async () => {
  output = await fsp.mkdtemp(join(os.tmpdir(), 'page-loader-'));
  resourcesOutputDirFullPath = join(output, resourcesDirPath);
});

describe('get response with mock, parse it and return correct data', () => {
  it('should create сorrect html file name', async () => {
    await pageLoader(fullUrl, output);
    const htmlPath = join(output, 'ru-hexlet-io-courses.html');
    await expect(isFileExist(htmlPath)).resolves.toBe(true);
  });
  it('should return сorrect html content', async () => {
    await pageLoader(fullUrl, output);
    const html = join(output, 'ru-hexlet-io-courses.html');
    await expect(fsp.readFile(html, 'utf8')).resolves.toBe(afterParsingHtml);
  });
  it('should download all resources', async () => {
    await pageLoader(fullUrl, output);
    await expect(fsp.readdir(resourcesOutputDirFullPath)).resolves.toEqual(expectedResources);
  });
  it('compare expected and recieved resource', async () => {
    await pageLoader(fullUrl, output);
    expectedResources.forEach(async (fileName) => {
      const outputResource = join(resourcesOutputDirFullPath, fileName);
      const expectedResource = getResourceFullPath(fileName);
      const expected = await fsp.readFile(expectedResource, 'utf8');
      await expect(fsp.readFile(outputResource, 'utf8')).resolves.toBe(expected);
    });
  });
});

describe('correct error handling', () => {
  it('should throw because bad url', async () => {
    const invalidRelativeUrl = '/cat-poems';
    const invalidFullUrl = `${baseUrl}${invalidRelativeUrl}`;
    const expected = `getaddrinfo ENOTFOUND ${invalidFullUrl}`;
    nock(baseUrl).get(invalidRelativeUrl).replyWithError(expected);
    await expect(pageLoader(invalidFullUrl, output)).rejects.toThrow(expected);
  });
  it('should throw because output not exists', async () => {
    const notExistsOutput = getPath('notExistsOutput');
    const fullResourcesDirPath = join(notExistsOutput, resourcesDirPath);
    const expected = `ENOENT: no such file or directory, mkdir '${fullResourcesDirPath}'`;
    await expect(pageLoader(fullUrl, notExistsOutput)).rejects.toThrow(expected);
  });
  it('should throw because permission denied', async () => {
    const withoutPermissonOutput = '/bin';
    const fullResourcesDirPath = join(withoutPermissonOutput, resourcesDirPath);
    const expected = `EACCES: permission denied, mkdir '${fullResourcesDirPath}`;
    await expect(pageLoader(fullUrl, withoutPermissonOutput)).rejects.toThrow(expected);
  });
});
