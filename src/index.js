import {
  loadPage,
  generatePageData,
  makeResourcesDir,
  downloadResources,
  savePage,
} from './util.js';

export default (url, output) => loadPage(url, output)
  .then((page) => generatePageData(page, url, output))
  .then((data) => makeResourcesDir(data))
  .then((data) => downloadResources(data))
  .then((html) => savePage(html));
