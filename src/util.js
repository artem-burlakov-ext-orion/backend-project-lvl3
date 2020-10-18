import fs from 'fs';

const { promises: fsp } = fs;

const getVersion = async () => await fsp.readFile('../package.json').version;

export {
  getVersion,
};
