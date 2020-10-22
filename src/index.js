import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { dirname, join } from 'path';

const { promises: fsp } = fs;

const SUFFIX = '_files';

const isAlphaNumeric = (sym) => sym.toUpperCase() !== sym || Number.isInteger(sym);

const convertData = (sym) => (isAlphaNumeric(sym) ? sym : '-');

const getConvertedPathByUrl = (fullUrl) => {
  // console.log('FULLURL: ', fullUrl);
  const url = fullUrl.split('//')[1].split('');
  return url.reduce((acc, elem) => `${acc}${convertData(elem)}`, '');
};

const getBaseDirPath = (url) => `${getConvertedPathByUrl(url)}_files`;
const getImageFilePath = (src) => {
  const arr = src.split('/');
  return arr[arr.length - 1];
};
const getImageLocalSrc = (url, src) => join(getBaseDirPath(url), getImageFilePath(src));
const getImageFullPath = (url, dir, src) => join(dir, getBaseDirPath(url), getImageFilePath(src));

const getHtmlFilePath = (url) => `${getConvertedPathByUrl(url)}.html`;
const getHtmlFullPath = (url, dir) => join(dir, getHtmlFilePath(url));
const getToDoDir = (url, dir) => join(dir, `${getBaseDirPath(url)}`);


const getResourceFullPath = (dir, href) => join(dir, href);

const mainUrl = 'https://ru.hexlet.io/courses';

const getConverted = (str) => str.replace(/\W/g, '-');

const getLocalDirName = (host, suffix) => {
  const preparedHost = host.split('//')[1];
  return `${getConverted(preparedHost)}${suffix}`;
}

const isLast = (index, length) => index === length - 1;
const getLastHref = (href) => href.includes('.') ? href : `${href}.html`;

const getLocalFileName = (href) => {
  const preparedHref = href.split('//')[1].split('/');
  return preparedHref.map((href, i) => {
    if (isLast(i, preparedHref.length)) {
      return getLastHref(href);
    }
    return getConverted(href);
  }).join('-');
};

const getResourceRelativePath = (href) => join(getLocalDirName(mainUrl, SUFFIX), getLocalFileName(href));

const isLocalResource = (data, origin) => data.origin === origin || !data.href.includes('//');

const getParsedData = (url, dir, html) => {
  const urlData = new URL(url);
  const $ = cheerio.load(html);
  const resources = [];
  const resourceHrefs = $('link[href]');
  resourceHrefs.attr('href', (i, href) => {
    const data = new URL(href, url);
    if (!isLocalResource(data, urlData.origin)) {
      return href;
    }
    const localHref = getResourceRelativePath(data.href);
    const source = data.href;
    const target = getResourceFullPath(dir, localHref);
    resources.push({
      source,
      target,
    });
    return href.replace(/.*/, localHref);
  });
  const resourceSrcs = $('script[src]');
  resourceSrcs.attr('src', (i, src) => {
    const data = new URL(src, url);
    if (!isLocalResource(data, urlData.origin)) {
      return src;
    }
    const localSrc = getResourceRelativePath(data.href);
    resources.push({
      source: data.href,
      target: getResourceFullPath(dir, localSrc),
    });
    return src.replace(/.*/, localSrc);
  });
  const imageLinks = $('img[src]');
  imageLinks.attr('src', (i, src) => {
    const localSrc = getImageLocalSrc(url, src);
    const target = getImageFullPath(url, dir, src);
    resources.push({
      source: src,
      target,
    });
    return src.replace(/.*/, localSrc);
  });
  return {
    resources,
    html: {
      content: $.html(),
      target: getHtmlFullPath(url, dir),
    },
  };
};

const saveHtml = (path, data) => fsp.writeFile(path, data);

const saveResources = (data) => {
  const promises = data.map(({ source, target }) => downloadFile(source, target));
  Promise.all(promises);
};

const downloadFile = (source, target) => {
  const writer = fs.createWriteStream(target);
  return axios({
    method: 'get',
    url: source,
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
  const { target, content } = data.html;
  saveHtml(target, content);
  saveResources(data.resources);
};

const getData = (url, dir) => new Promise((resolve, reject) => axios.get(url)
  .then((res) => resolve(getParsedData(url, dir, res.data)))
);

const makeDir = (url, dir) => fsp.mkdir(getToDoDir(url, dir), { recursive: true });

export default (url, dir = process.cwd()) => makeDir(url, dir)
  .then(() => getData(url, dir))
  .then((data) => saveData(data));
 