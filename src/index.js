import { parseByUrl, makeDir, saveData } from './util.js';

export default (url, dir = process.cwd()) => parseByUrl(url, dir)
  .then((data) => makeDir(data.toDoDir).then(() => saveData(data)));
