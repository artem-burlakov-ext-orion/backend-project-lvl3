#! /usr/bin/env node

import program from 'commander';
import pageLoader from '../index.js';
// import { getVersion } from '../util.js';

program
  .version('0.0.1')
  .description('download page from internet')
  .option('-o, --output [path]', 'output dir path', `${process.cwd()}`)
  .arguments('<url>')
  .action((url) => pageLoader(url, program.output))
  .parse(process.argv);
