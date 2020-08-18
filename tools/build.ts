import { ngPackagr } from 'ng-packagr';
import { join } from 'path';

function buildPackage(): Promise<void> {
  return ngPackagr()
    .forProject(join(__dirname, '../src/package.json'))
    .withTsConfig(join(__dirname, '../src/tsconfig.lib.json'))
    .build();
}

buildPackage().catch(e => {
  console.error(e);
  process.exit(1);
});
