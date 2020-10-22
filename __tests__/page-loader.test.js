import fs from 'fs';
import os from 'os';
import nock from 'nock';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pageLoader from '../src/index';

const { promises: fsp } = fs;
// nock.disableNetConnect();


const getPath = (fileName) => join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__', fileName);

let dirPath;
let expectedResources;
let beforeParsing;
let afterParsing;

const isFileExist = (filePath) => fsp.access(filePath).then(() => true).catch(() => false);

beforeAll(async () => {
  beforeParsing = await fsp.readFile(getPath('before-parsing.html'), 'utf8');
  afterParsing = await fsp.readFile(getPath('ru-hexlet-io-courses.html'), 'utf8');
  const scope = nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .reply(200, beforeParsing);
});

beforeEach(async () => {
  dirPath = await fsp.mkdtemp(join(os.tmpdir(), 'page-loader-'));
  expectedResources = await fsp.readdir(join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__', 'ru-hexlet-io-courses_files'));
});

describe('get response with mock and parse to correct data', () => {
  it('should create сorrect html file name', async () => {
    await pageLoader('https://ru.hexlet.io/courses', dirPath);
    const filePath = join(dirPath, 'ru-hexlet-io-courses.html');
    await expect(isFileExist(filePath)).resolves.toBe(true);
  });
  it('should return сorrect html content', async () => {    
    await pageLoader('https://ru.hexlet.io/courses', dirPath);
    const filePath = join(dirPath, 'ru-hexlet-io-courses.html');
    await expect(fsp.readFile(filePath, 'utf8')).resolves.toBe(afterParsing);
  });
  it('should download all resources', async () => {
    await pageLoader('https://ru.hexlet.io/courses', dirPath);
    await expect(fs.readdir(join(dirPath, 'ru-hexlet-io-courses_files')).resolves.toBe(expectedResources));
  });
});



// test('should create file', async () => {
//   await pageLoader('https://ru.hexlet.io/courses', dirPath);
//   const expected = await fsp.readFile(getPath('result.html'), 'utf8');
//   const filePath = join(dirPath, 'ru-hexlet-io-courses.html');
//   await expect(fsp.readFile(filePath, 'utf8')).resolves.toBe(expected);
// });
