// eslint-disable-next-line import/no-import-module-exports
import { execSync } from 'child_process';

module.exports = () => {
  console.log('Trying to kill test setups in the CI 🦾 ...');
  try {
    // kill lambda
    execSync("kill -9 $(lsof -i:3000 | tail -1 | awk '{print $2}')");
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.error(`Error: \n ${e}`);
    process.exit(1);
  }
};
