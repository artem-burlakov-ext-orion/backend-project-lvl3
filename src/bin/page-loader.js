#! /usr/bin/env node

import program from 'commander';
import pageLoader from '../index';
import getVersion from '../util';

program
  .version(getVersion())
  .description('download page from internet')
  .option('-o, --output [path]', 'output dir path', `${process.cwd()}`)
  .arguments('<url>')
  .action((url) => pageLoader(url, program.output))
  .parse(process.argv);  