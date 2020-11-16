import { promises as fsp, createWriteStream } from 'fs';
import cheerio from 'cheerio';
import { join, parse } from 'path';
import axios from 'axios';
import debug from 'debug';
import 'axios-debug-log';
import Listr from 'listr';

const log = debug('page-loader');

const DIRFIX = '_files';
const HTMLFIX = '.html';
const NAMEFIX = '-';

const tags = {
  link: 'href',
  script: 'src',
  img: 'src',
};

const getConverted = (url) => {
  const newUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return newUrl.replace(/\W/g, NAMEFIX);
};

const isResourceFromThisSite = (attrOrigin, urlOrigin) => attrOrigin === urlOrigin;

const getDir = (data) => {
  const dirName = getConverted(`${data.hostname}${data.pathname}`);
  return `${dirName}${DIRFIX}`;
};

const getResourceLocalPath = (urlData, attrData) => {
  const dirName = getDir(urlData);
  const parsed = parse(`${attrData.hostname}${attrData.pathname}`);
  const { base, dir, ext } = parsed;
  const convertedFileName = (ext.includes('.')) ? `${getConverted(dir)}${NAMEFIX}${base}` : `${getConverted(dir)}${NAMEFIX}${base}${HTMLFIX}`;
  return join(dirName, convertedFileName);
};

const getHtmlLocalPath = (output, urlData) => {
  const baseName = getConverted(`${urlData.hostname}${urlData.pathname}`);
  const fixedBaseName = `${getConverted(baseName)}${HTMLFIX}`;
  return `${output}/${fixedBaseName}`;
};

const getPage = (url) => {
  log(`Start parsing '${url}'`);
  return axios.get(url)
    .then(({ data }) => cheerio.load(data, { decodeEntities: false }));
};

const getPageData = (dom, url, output) => {
  const urlData = new URL(url);
  const resources = Object.entries(tags)
    .reduce((acc, [key, value]) => {
      const current = [];
      dom(`${key}[${value}]`).attr(value, (i, elem) => {
        const attrData = new URL(elem, url);
        if (!isResourceFromThisSite(attrData.origin, urlData.origin)) {
          return elem;
        }
        const localPath = getResourceLocalPath(urlData, attrData);
        const source = attrData.href;
        const target = join(output, localPath);
        current.push({ source, target });
        return elem.replace(/.*/, localPath);
      });
      return [...acc, ...current];
    }, []);
  return {
    dir: join(output, getDir(urlData)),
    resources,
    html: {
      content: dom.html(),
      target: getHtmlLocalPath(output, urlData),
    },
  };
};

const downloadFile = (source, target) => axios({ method: 'get', url: source, responseType: 'stream' })
  .then(({ data }) => {
    log(`Start downloading resource '${source}'`);
    const stream = data.pipe(createWriteStream(target));
    log(`Save resource to '${target}'`);
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', () => reject());
    });
  });

const makeResourcesDir = (data) => fsp.mkdir(data.dir)
  .then(() => data);

const downloadResources = (data) => {
  log('Save resources');
  const tasks = data.resources.map(({ source, target }) => ({
    title: `Download from '${source}' to '${target}'`,
    task: () => downloadFile(source, target),
  }));
  return new Listr(tasks, { concurrent: true }).run()
    .then(() => data.html);
};

const downloadHtml = (html) => {
  log('Save html');
  const tasks = [{
    title: `Save html content to '${html.target}'`,
    task: () => fsp.writeFile(html.target, html.content),
  }];
  return new Listr(tasks, { concurrent: true }).run()
    .then(() => html.target);
};

export {
  getPage,
  getPageData,
  makeResourcesDir,
  downloadResources,
  downloadHtml,
};
