import {
  getPage,
  getPageData,
  makeResourcesDir,
  downloadResources,
  downloadHtml,
} from './util.js';

export default (url, output) => getPage(url, output)
  .then((page) => getPageData(page, url, output))
  .then((data) => makeResourcesDir(data))
  .then((data) => downloadResources(data))
  .then((html) => downloadHtml(html));
