import { readFile, writeFile } from 'fs';
import pdf from 'pdf-parse';
import { promisify } from 'util';
import { Download } from './downloader';
import { parseRules } from './parser';

// promisify fs functions
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

type args = {
  inputPath: string,
  outputPath: string,
  download?: boolean,
}

export async function Rules(args: args) {
  const { inputPath, outputPath, download} = args;
  if (download) {
    await Download(inputPath);
  }
  const fileBuffer = await readFileAsync(inputPath);
  const rulesText = (await pdf(fileBuffer)).text;
  const rules = parseRules(rulesText);
  await writeFileAsync(outputPath, JSON.stringify(rules));
}
