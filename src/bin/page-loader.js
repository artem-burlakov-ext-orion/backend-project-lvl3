#! /usr/bin/env node

import program from 'commander';
import pageLoader from '../../index.js';

program
  .version('0.0.1')
  .description('download page and save it')
  .option('-o, --output [path]', 'output dir path', process.cwd())
  .arguments('<url>')
  .action((url) => pageLoader(url, program.output)
    .then((page) => console.log(`\nSaved page ${page}`))
    .catch(({ message }) => {
      console.error(message);
      process.exit(1);
    }))
  .parse(process.argv);
