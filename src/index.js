import { parseByUrl, makeDir, saveData } from './util.js';

export default (url, output) => parseByUrl(url, output)
  .then((data) => makeDir(data.resourcesDirFull)
    .then(() => saveData(data))
    .then(() => data.html.target))
  .catch((error) => {
    throw new Error(error);
  });
