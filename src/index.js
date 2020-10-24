import { promises as fsp, createWriteStream } from 'fs';
import axios from 'axios';
import debug from 'debug';
import { saveHtml, parseByUrl, makeDir } from './util.js';

const downloadFile = (source, target) => axios({
  method: 'get',
  url: source,
  responseType: 'stream',
}).then(({ data }) => {
  const stream = data.pipe(createWriteStream(target));
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', () => reject());
  });
});

const saveResources = (data) => {
  const promises = data.map(({ source, target }) => downloadFile(source, target));
  Promise.all(promises);
};

const saveData = (data) => {
  const { target, content } = data.html;
  saveHtml(target, content);
  saveResources(data.resources);
};

// const getData = (url, dir) => new Promise((resolve, reject) => )
//   .then((res) => resolve(getParsedData(url, dir, res.data)))
// );

export default (url, dir = process.cwd()) => parseByUrl(url, dir)
  .then((data) => makeDir(data.toDoDir)
  .then(() => saveData(data))
  );
 