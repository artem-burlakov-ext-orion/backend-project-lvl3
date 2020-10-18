#! /usr/bin/env node

import program from 'commander';
import pageLoader from '../index';
import getVersion from '../utils/utils';

program
  .version(getVersion())
  .description('')
  .option('-o, --output [path]', 'output dir path', `${process.cwd()}`)
  .arguments('<url>')
  .action((url) => pageLoader(url, program.output))
  .parse(process.argv)
  