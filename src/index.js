import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { dirname, join } from 'path';

const { promises: fsp} = fs;

const isAlphaNumeric = (sym) => sym.toUpperCase() !== sym || Number.isInteger(sym);

const convertData = (sym) => isAlphaNumeric(sym) ? sym : '-';

const getBasePath = (fullUrl) => {
  const url = fullUrl.split('//')[1].split('');
  return url.reduce((acc, elem) => `${acc}${convertData(elem)}`, '');
};

const getImageDirPath = (url) => `${getBasePath(url)}_files`;
const getImageFilePath = (src) => {
  const arr = src.split('/');
  return arr[arr.length - 1];
};
const getImageFullPath = (url, dir, src) => join(dir, getImageDirPath(url), getImageFilePath(src));
const getHtmlFilePath = (url) => `${getBasePath(url)}.html`;
const getHtmlFullPath = (url, dir) => join(dir, getHtmlFilePath(url));
const getToDoDir = (url, dir) => join(dir, `${getImageDirPath(url)}`);

const getParsedData = (url, dir, html) => {
  const $ = cheerio.load(html);
  const images = [];
  const imageLinks = $('img[src]');
  imageLinks.attr('src', (i, src) => {
    const fullPath = `${getImageFullPath(url, dir, src)}`;
    images.push({
      src,
      fullPath,
    });
    console.log(images);
    return src.replace(/.*/, fullPath);
  });
  return {
    images,
    html: {
      content: $.html(),
      fullPath: getHtmlFullPath(url, dir),
    },
    todoDir: getToDoDir(url, dir),
  };
};

const getData = (url, dir) => {
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then((res) => {
        const data = getParsedData(url, dir, res.data);
        resolve(data);
      });
  });
};

const saveData = (data) => {
  fsp.mkdir(data.todoDir, { recursive: true })
    .then((resolve) => fsp.writeFile(data.html.fullPath, data.html.content));
  const promises = data.images
    .map(({ src, fullPath }) => axios.get(src, { responseType: 'arrayBuffer' })
      .then((res) => {
      const buf = Buffer.from(res.data, 'binary').toString('base64');
      fsp.writeFile(fullPath, buf);
      })
    );
  Promise.all(promises);
};

export default (url, dir = process.cwd()) => getData(url, dir)
  .then((data) => saveData(data));

