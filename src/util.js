import { promises as fsp, createWriteStream } from 'fs';
import cheerio from 'cheerio';
import { join } from 'path';
import axios from 'axios';
import debug from 'debug';
import 'axios-debug-log';
import Listr from 'listr';
import prettier from 'prettier';
import getHumanLikeError from './errors.js';

const log = debug('page-loader');

const SUFFIX = '_files';

const isAlphaNumeric = (sym) => sym.toUpperCase() !== sym || Number.isInteger(sym);

const convertData = (sym) => (isAlphaNumeric(sym) ? sym : '-');

const getConvertedPathByUrl = (fullUrl) => {
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
const getLastHref = (href) => (href.includes('.') ? href : `${href}.html`);

const getLocalFileName = (href) => {
  const preparedHref = href.split('//')[1].split('/');
  return preparedHref.map((preHref, i) => {
    if (isLast(i, preparedHref.length)) {
      return getLastHref(preHref);
    }
    return getConverted(preHref);
  }).join('-');
};

const isLocalResource = (data, origin) => data.origin === origin || !data.href.includes('//');

const tags = {
  link: 'href',
  script: 'src',
  img: 'src',
};

const makeDir = (dir) => {
  log('Make output dir');
  return fsp.mkdir(dir)
    .catch(({ message }) => {
      throw new Error(getHumanLikeError('making directory', message, dir));
    });
};

const getData = (dom, url, output) => {
  const resourceDirPath = getLocalDirName(url);
  const resourceFullDirPath = join(output, resourceDirPath);
  const htmlFullPath = getHtmlFullPath(url, output);
  const urlData = new URL(url);
  const resources = Object.entries(tags).reduce((acc, [key, value]) => {
    const current = [];
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
      content: prettier.format(dom.html(), { parser: 'html' }),
      target: htmlFullPath,
    },
    resourcesDir: resourceFullDirPath,
  };
};

const parseByUrl = (url, output) => {
  log('Set arguments for parsing');
  log(`Url: ${url}`);
  log(`Output: ${output}`);
  log('Start parsing');
  return axios.get(url)
    .then(({ data }) => {
      const dom = cheerio.load(data, { decodeEntities: false });
      return getData(dom, url, output);
    })
    .catch(({ message }) => {
      throw new Error(getHumanLikeError('parsing', url, message));
    });
};

const downloadFile = (source, target) => axios({ method: 'get', url: source, responseType: 'stream' })
  .then(({ data }) => {
    log('Start downloading resource');
    const stream = data.pipe(createWriteStream(target));
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', () => reject());
    });
  })
  .catch(({ message }) => {
    throw new Error(getHumanLikeError('downloading', source, message));
  });

const saveResources = (data) => {
  log('Save resources');
  return data.map(({ source, target }) => ({
    title: `Download from '${source}' to '${target}'`,
    task: () => downloadFile(source, target),
  }));
};

const saveHtml = (html) => {
  log('Save html');
  return {
    title: `Save html content to '${html.target}'`,
    task: () => fsp.writeFile(html.target, html.content),
  };
};

const saveData = (data) => {
  const tasks = [saveHtml(data.html), ...saveResources(data.resources)];
  const listr = new Listr(tasks, { concurrent: true });
  return listr.run();
};

export {
  parseByUrl,
  makeDir,
  saveData,
};
