import fs from 'fs';
import os from 'os';
import nock from 'nock';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pageLoader from '../src/index';

const { promises: fsp } = fs;

const getPath = (fileName) => join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__', fileName);

let dirPath;
beforeEach(async () => {
  dirPath = await fsp.mkdtemp(join(os.tmpdir(), 'page-loader-'));
});

const scope = nock('https://ru.hexlet.io')
  .get('/courses')
  .reply(200, 'ok' );
  

test('should return сorrect data', async () => {
  await pageLoader('https://ru.hexlet.io/courses', dirPath);
  const expected = await fsp.readFile(getPath('result.html'), 'utf8');
  const filePath = join(dirPath, 'ru-hexlet-io-courses.html');
  await expect(fsp.readFile(filePath, 'utf8')).resolves.toBe(expected);
});



// test('should create file', async () => {
//   await pageLoader('https://ru.hexlet.io/courses', dirPath);
//   const expected = await fsp.readFile(getPath('result.html'), 'utf8');
//   const filePath = join(dirPath, 'ru-hexlet-io-courses.html');
//   await expect(fsp.readFile(filePath, 'utf8')).resolves.toBe(expected);
// });
