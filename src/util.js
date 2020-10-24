import { promises as fsp } from 'fs';
import cheerio from 'cheerio';
import { dirname, join } from 'path';
import axios from 'axios';

const getVersion = async () => await fsp.readFile('../package.json').version;

const SUFFIX = '_files';

const isAlphaNumeric = (sym) => sym.toUpperCase() !== sym || Number.isInteger(sym);

const convertData = (sym) => (isAlphaNumeric(sym) ? sym : '-');

const getConvertedPathByUrl = (fullUrl) => {
  // console.log('FULLURL: ', fullUrl);
  const url = fullUrl.split('//')[1].split('');
  return url.reduce((acc, elem) => `${acc}${convertData(elem)}`, '');
};

const getHtmlFilePath = (url) => `${getConvertedPathByUrl(url)}.html`;
const getHtmlFullPath = (url, dir) => join(dir, getHtmlFilePath(url));

const getConverted = (str) => str.replace(/\W/g, '-');
const getLocalDirName = (host) => {
  const preparedHost = host.split('//')[1];
  return `${getConverted(preparedHost)}${SUFFIX}`;
};
const isLast = (index, length) => index === length - 1;
const getLastHref = (href) => href.includes('.') ? href : `${href}.html`;
// const getToDoDir = (url, dir) => join(dir, getLocalDirName(url));

const getLocalFileName = (href) => {
  const preparedHref = href.split('//')[1].split('/');
  return preparedHref.map((href, i) => {
    if (isLast(i, preparedHref.length)) {
      return getLastHref(href);
    }
    return getConverted(href);
  }).join('-');
};
const getResourceFullPath = (dir, href) => join(dir, href);
// const getResourceRelativePath = (href) => join(getLocalDirName(href, SUFFIX), getLocalFileName(href));
const isLocalResource = (data, origin) => data.origin === origin || !data.href.includes('//');

const tags = { 
  link: 'href',
  script: 'src',
  img: 'src'
};

const makeDir = (dir) => fsp.mkdir(dir, { recursive: true });

const getData = (dom, url, output) => {
  const resourceDirPath = getLocalDirName(url);
  const resourceFullDirPath = join(output, resourceDirPath);
  const htmlFullPath = getHtmlFullPath(url, output);
  const urlData = new URL(url);
  const resources = Object.entries(tags)
  .reduce((acc, [key, value]) => {
    let current = [];
    dom(`${key}[${value}]`).attr(value, (i, elem) => {
      const attrUrlData = new URL(elem, urlData.href);
      if (!isLocalResource(attrUrlData, urlData.origin)) {
        return elem;
      }
      const resourceFileName = getLocalFileName(attrUrlData.href);
      const localHref = join(resourceDirPath, resourceFileName);
      const source = attrUrlData.href;
      const target = join(resourceFullDirPath, resourceFileName);
      current.push({ source, target });
      return elem.replace(/.*/, localHref);
    });
    return [...acc, ...current];
  }, []);
  return {
    resources,
    html: {
      content: dom.html(),
      target: htmlFullPath,
    },
    toDoDir: resourceFullDirPath,
  };
};

const parseByUrl = (url, output) => new Promise((resolve, reject) => axios.get(url)
  .then((res) => {
    const dom = cheerio.load(res.data);
    const parsedData = getData(dom, url, output);
    resolve(parsedData);
  })
);
 
// const getParsedData = (url, output) => new Promise((resolve, reject) => {
  
//   makeDir(resourceFullDirPath)
//     .then(() => parseByUrl(url, output)
//     .then((data) => resolve(data))
//     )
// });

const saveHtml = (path, data) => fsp.writeFile(path, data);

export {
  parseByUrl,
  saveHtml,
  makeDir,
  getVersion,
};
