import { join } from 'path';
import { existsSync, createReadStream, createWriteStream, readFileSync } from 'fs';

const { name } = JSON.parse(readFileSync('../package.json', 'utf8'));

function copyReadmeAfterSuccessfulBuild(): void {
  const path = join(__dirname, '../README.md');
  const readmeDoesNotExist = !existsSync(path);

  if (readmeDoesNotExist) {
    return console.warn(`README.md doesn't exist on the root level!`);
  }

  createReadStream(path)
    .pipe(createWriteStream(join(__dirname, `../dist/${name}/README.md`)))
    .on('finish', () => {
      console.log(`Successfully copied README.md into dist/${name} folder!`);
    });
}

copyReadmeAfterSuccessfulBuild();
