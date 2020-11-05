import { promises as fsp, createWriteStream } from 'fs';
import cheerio from 'cheerio';
import { join, parse } from 'path';
import axios from 'axios';
import debug from 'debug';
import 'axios-debug-log';
import Listr from 'listr';
import getHumanLikeError from './errors.js';

const log = debug('page-loader');

const DIRFIX = '_files';
const HTMLFIX = '.html';
const NAMEFIX = '-';

const getConverted = (url) => {
  const newUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return newUrl.replace(/\W/g, NAMEFIX);
};

const isLocalResource = (data, origin) => data.origin === origin || !data.href.includes('//');

const tags = {
  link: 'href',
  script: 'src',
  img: 'src',
};

const getOutputByFullDirPath = (dir) => dir.split('/').slice(1, -1).join('/');

const makeDir = (dir) => fsp.mkdir(dir)
  .catch(({ message }) => {
    log(`Output does not exist '${getOutputByFullDirPath(dir)}'`);
    throw new Error(getHumanLikeError('making directory', message, dir));
  });

const getBaseName = (url) => getConverted(url.split('//')[1]);

const getNames = (url) => {
  const name = getBaseName(url);
  return {
    resourcesDir: `${name}${DIRFIX}`,
    htmlFile: `${name}${HTMLFIX}`,
  };
};

const getLocalResourceFileName = (data) => {
  const href = `${data.hostname}${data.pathname}`;
  if (!data.pathname.includes('.')) {
    return `${getConverted(href)}.html`;
  }
  const parsedHref = parse(href);
  const base = `${parsedHref.dir}/${parsedHref.name}`;
  return `${getConverted(base)}${parsedHref.ext}`;
};

const getData = (dom, url, output) => {
  const urlData = new URL(url);
  const names = getNames(url);
  const resources = Object.entries(tags).reduce((acc, [key, value]) => {
    const current = [];
    dom(`${key}[${value}]`).attr(value, (i, elem) => {
      const attrUrlData = new URL(elem, urlData.href);
      if (!isLocalResource(attrUrlData, urlData.origin)) {
        return elem;
      }
      const resourceFileName = getLocalResourceFileName(attrUrlData);
      const localHref = join(names.resourcesDir, resourceFileName);
      const source = attrUrlData.href;
      const target = join(output, localHref);
      current.push({ source, target });
      return elem.replace(/.*/, localHref);
    });
    return [...acc, ...current];
  }, []);
  return {
    resources,
    html: {
      content: dom.html(),
      target: join(output, names.htmlFile),
    },
    resourcesDirFull: join(output, names.resourcesDir),
  };
};

const parseByUrl = (url, output) => {
  log(`Start parsing '${url}'`);
  return axios.get(url)
    .then(({ data }) => {
      const dom = cheerio.load(data, { decodeEntities: false });
      return getData(dom, url, output);
    })
    .catch(({ message }) => {
      throw new Error(getHumanLikeError('parsing', message, url));
    });
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
  })
  .catch(({ message }) => {
    throw new Error(getHumanLikeError('downloading', message, source));
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
  return new Listr(tasks, { concurrent: true }).run();
};

export {
  parseByUrl,
  makeDir,
  saveData,
};
