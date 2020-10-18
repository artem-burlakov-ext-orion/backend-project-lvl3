import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { dirname, join } from 'path';
// import os from 'os';

const { promises: fsp} = fs;

const isAlphaNumeric = (sym) => sym.toUpperCase() !== sym || Number.isInteger(sym);

const convertData = (sym) => isAlphaNumeric(sym) ? sym : '-';

const getBasePath = (fullUrl) => {
  const url = fullUrl.split('//')[1].split('');
  return url.reduce((acc, elem) => `${acc}${convertData(elem)}`, '');
};

const getFullFilePath = (dir, name) => join(dir, name);

// const getData = (url, dir, content) => ({
//   html: {
//     fullPath: getFullFilePath(dir, `${getBaseFileName(url)}.html`),
//     data: content,
//   },
//   images: {
//     fullPath: getFullFilePath(dir, `${getBaseFileName(url)}_files`,
//     data: ,
//   },
// });

const getImageDirPath = (url) => `${getBasePath(url)}_files`;
const getImageFilePath = (src) => src.match(/\w+\.png|jpg/)[0];
const getImageFullPath = (url, dir, src) => join(dir, getImageDirPath(url), getImageFilePath(src));


const getParsedData = (url, dir, html) => {
  const $ = cheerio.load(html);
  const imageLinks = [];
  $('img').each((i, link) => imageLinks.push(($(link).attr('src'))));
  const images = $('img[src]');
  images.attr('src', (i, src) => src.replace(/.*/, `${getImageFullPath(url, dir, src)}`));
  return {
    imageLinks,
    html: $.html(),
  };
};

const getData = (url, dir) => {
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then((res) => {
        const { imageLinks, html } = getParsedData(url, dir, res.data);
        console.log(html);
        console.log(imageLinks);
        resolve({ imageLinks, html });
      });
  });
};




// const saveData = (fullPath, data) => fsp.writeFile(filePath, data);

export default (url, dir = process.cwd()) => {
  return getData(url, dir)
    .then((res) => console.log(res));
};

// const url = 'https://ru.hexlet.io/courses';
// // const filePath = join(os.tmpdir(), 'page-loader-', 'ru-hexlet-io-couses.html');

// const pageLoader =  (url, file) => axios.get(url).then((res) => fsp.writeFile(file, res.data));

// pageLoader(url, '../__fixtures__/result.html');
// // console.log(getFileName('https://ru.hexlet.io/courses'));
