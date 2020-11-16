#! /usr/bin/env node

import program from 'commander';
import pageLoader from '../index.js';

program
  .version('0.0.1')
  .description('download page and save it')
  .option('-o, --output [path]', 'output dir path', process.cwd())
  .arguments('<url>')
  .action((url) => pageLoader(url, program.output)
    .then((path) => console.log(`\nSaved page ${path}`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    }))
  .parse(process.argv);
