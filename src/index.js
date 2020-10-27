
import { parseByUrl, makeDir, saveData } from './util.js';

export default (url, output = process.cwd()) => parseByUrl(url, output)
  .then((data) => makeDir(data.resourcesDir).then(() => saveData(data)));
