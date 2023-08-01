// eslint-disable-next-line import/no-import-module-exports
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

const SERVER_OK = 'Press CTRL+C to quit';

const setupServer = (process: ChildProcessWithoutNullStreams) => new Promise<ChildProcessWithoutNullStreams>((resolve: (test: ChildProcessWithoutNullStreams) => void) => {
  process.stdout.setEncoding('utf-8').on('data', (stream: string) => {
    console.log(stream);
    if (stream.includes(SERVER_OK)) {
      resolve(process);
    }
  });

  process.stderr.setEncoding('utf-8').on('data', (stream: string) => {
    if (stream.includes(SERVER_OK)) {
      resolve(process);
    }
  });

  process.on('exit', (code: number, signal: string) => {
    if (code !== 137) {
      console.info(
        `process terminated with code: ${code} and signal: ${signal}`,
      );
    }
  });
});

const server = spawn('npm', ['run', 'start:ci', '--', '--warm-containers', 'EAGER'], {});

module.exports = async () => {
  try {
    console.log('\nSetting up Integration tests...\n');
    const instance = await setupServer(server);
    const { pid } = instance;
    console.info(`
    start script running ✅ ...
    on pid: ${pid ?? ''}
    `);
  } catch (e) {
    console.error('Something wrong happened:\n');
    console.error(e);
    process.exit(1);
  }
};
