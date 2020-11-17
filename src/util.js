import { promises as fsp } from 'fs';
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

const formatName = (data) => {
  const name = data.endsWith('/') ? data.slice(0, -1) : data;
  return name.replace(/\W/g, NAMEFIX);
};

const isInternal = (attrOrigin, urlOrigin) => attrOrigin === urlOrigin;

const buildResourceDir = (data) => {
  const name = formatName(`${data.hostname}${data.pathname}`);
  return `${name}${DIRFIX}`;
};

const buildResourceLocalPath = (urlData, attrData) => {
  const dirName = buildResourceDir(urlData);
  const parsed = parse(`${attrData.hostname}${attrData.pathname}`);
  const { base, dir, ext } = parsed;
  const formattedFileName = `${formatName(dir)}${NAMEFIX}${base}`;
  const fileName = ext.includes('.') ? formattedFileName : `${formattedFileName}${HTMLFIX}`;
  return join(dirName, fileName);
};

const buildHtmlLocalPath = (output, urlData) => {
  const baseData = formatName(`${urlData.hostname}${urlData.pathname}`);
  const fixedBaseData = `${formatName(baseData)}${HTMLFIX}`;
  return join(output, fixedBaseData);
};

const loadPage = (url) => {
  log(`Load content from page '${url}'`);
  return axios.get(url)
    .then(({ data }) => cheerio.load(data, { decodeEntities: false }));
};

const generatePageData = (dom, url, output) => {
  log(`Parse content from page ${url}`);
  const urlData = new URL(url);
  const resources = Object.entries(tags)
    .reduce((acc, [key, value]) => {
      const current = [];
      dom(`${key}[${value}]`).attr(value, (i, elem) => {
        const attrData = new URL(elem, url);
        if (!isInternal(attrData.origin, urlData.origin)) {
          return elem;
        }
        const localPath = buildResourceLocalPath(urlData, attrData);
        const source = attrData.href;
        const target = join(output, localPath);
        current.push({ source, target });
        return elem.replace(/.*/, localPath);
      });
      return [...acc, ...current];
    }, []);
  return {
    dir: join(output, buildResourceDir(urlData)),
    resources,
    html: {
      content: dom.html(),
      target: buildHtmlLocalPath(output, urlData),
    },
  };
};

const downloadFile = (source, target) => {
  log(`Download from '${source}' to '${target}'`);
  return axios.get(source, { responseType: 'arraybuffer' })
    .then(({ data }) => fsp.writeFile(target, data, 'utf-8'));
};

const makeResourcesDir = (data) => fsp.mkdir(data.dir)
  .then(() => data);

const downloadResources = (data) => {
  const tasks = data.resources.map(({ source, target }) => ({
    title: `Download from '${source}' to '${target}'`,
    task: () => downloadFile(source, target),
  }));
  return new Listr(tasks, { concurrent: true }).run()
    .then(() => data.html);
};

const savePage = (html) => {
  const tasks = [{
    title: `Save html content to '${html.target}'`,
    task: () => {
      log(`Save html content to '${html.target}'`);
      return fsp.writeFile(html.target, html.content);
    },
  }];
  return new Listr(tasks, { concurrent: true }).run()
    .then(() => html.target);
};

export {
  loadPage,
  generatePageData,
  makeResourcesDir,
  downloadResources,
  savePage,
};
