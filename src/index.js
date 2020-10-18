import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { dirname, join } from 'path';

const { promises: fsp } = fs;

const isAlphaNumeric = (sym) => sym.toUpperCase() !== sym || Number.isInteger(sym);

const convertData = (sym) => (isAlphaNumeric(sym) ? sym : '-');

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
    return src.replace(/.*/, fullPath);
  });
  return {
    images,
    html: {
      content: $.html(),
      fullPath: getHtmlFullPath(url, dir),
    },
  };
};

const saveHtml = (path, data) => fsp.writeFile(path, data);
const saveImages = (imagesData) => {
  const promises = imagesData
    .map(({ src, fullPath }) => downloadFile(src, fullPath));
  Promise.all(promises);
};



const downloadFile = (fileUrl, outputPath) => {
  const writer = fs.createWriteStream(outputPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then((response) =>
    new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', (err) => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
      });
    }));
};

const saveData = (data) => {
  saveHtml(data.html.fullPath, data.html.content);
  saveImages(data.images);
};

const getData = (url, dir) => new Promise((resolve, reject) => {
  axios.get(url)
    .then((res) => {
      const data = getParsedData(url, dir, res.data);
      resolve(data);
    });
});

const makeDir = (url, dir) => fsp.mkdir(getToDoDir(url, dir), { recursive: true });

export default (url, dir = process.cwd()) => makeDir(url, dir)
  .then(() => getData(url, dir)
  .then((data) => saveData(data))
  );
