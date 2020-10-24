import fs from 'fs';
import os from 'os';
import nock from 'nock';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pageLoader from '../src/index';

const { promises: fsp } = fs;

nock.disableNetConnect();

let getPath;
let getResourcePath;
let fullUrl;
let baseUrl;
let resources;
let output;
let expectedResources;
let beforeParsing;
let afterParsing;
let rss;

const isFileExist = (filePath) => fsp.access(filePath).then(() => true).catch(() => false);

beforeAll(async () => {
  fullUrl = 'https://ru.hexlet.io/courses';
  baseUrl = 'https://ru.hexlet.io';
  resources = 'ru-hexlet-io-courses_files';
  getPath = (name) => join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__', name);
  getResourcePath = (resource) => join(getPath(resources), resource);
  beforeParsing = await fsp.readFile(join(getPath(resources), 'ru-hexlet-io-courses.html'), 'utf8');
  afterParsing = await fsp.readFile(getPath('ru-hexlet-io-courses.html'), 'utf8');
  rss = await fsp.readFile(getResourcePath('ru-hexlet-io-lessons.rss'), 'utf8');
  nock(baseUrl)
    .persist()
    .get('/courses')
    .reply(200, beforeParsing)
    .get('/lessons.rss')
    .reply(200, rss);
});

beforeEach(async () => {
  output = await fsp.mkdtemp(join(os.tmpdir(), 'page-loader-'));
  expectedResources = await fsp.readdir(getPath(resources));
});

describe('get response with mock and parse to correct data', () => {
  it('should create сorrect html file name', async () => {
    await pageLoader(fullUrl, output);
    const htmlPath = join(output, 'ru-hexlet-io-courses.html');
    await expect(isFileExist(htmlPath)).resolves.toBe(true);
  });
  it('should return сorrect html content', async () => {
    await pageLoader(fullUrl, output);
    const html = join(output, 'ru-hexlet-io-courses.html');
    await expect(fsp.readFile(html, 'utf8')).resolves.toBe(afterParsing);
  });
  it('should download all resources', async () => {
    await pageLoader(fullUrl, output);
    await expect(fsp.readdir(join(output, resources))).resolves.toEqual(expectedResources);
  });
});
