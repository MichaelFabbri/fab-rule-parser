import { program } from 'commander';

program
  .description('Parse Flesh and Blood\'s Comprehensive Rules into a json file')
  .option('-d, --download', 'download the latest pdf')
  .option('-o, --outfile <path>', 'output json file path')
  .option('-i, --infile <path>', 'input pdf file path')
  .action(o => {
    console.log(o)
  });

program.parse();