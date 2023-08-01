// eslint-disable-next-line import/no-import-module-exports
import { ChildProcessWithoutNullStreams, spawnSync } from 'child_process';

const SERVER_OK = 'Press CTRL+C to quit';

const setupServer = (proc: ChildProcessWithoutNullStreams) => new Promise<ChildProcessWithoutNullStreams>((resolve: (test: ChildProcessWithoutNullStreams) => void) => {
  proc.stdout.setEncoding('utf-8').on('data', (stream: string) => {
    if (stream.includes(SERVER_OK)) {
      resolve(proc);
    }
  });

  proc.stdout.pipe(process.stdout);

  proc.stderr.setEncoding('utf-8').on('data', (stream: string) => {
    if (stream.includes(SERVER_OK)) {
      resolve(proc);
    }
  });

  proc.on('exit', (code: number, signal: string) => {
    if (code !== 137) {
      console.info(
        `process terminated with code: ${code} and signal: ${signal}`,
      );
    }
  });
});

// eslint-disable-next-line @typescript-eslint/require-await
module.exports = async () => {
  try {
    console.log('\nSetting up Integration tests...\n');
    const server = spawnSync('npm', ['run', 'start:ci', '--', '--warm-containers', 'EAGER'], {});
    console.log(Buffer.from(server.stdout).toString());
    // const instance = await setupServer(server);
    // const { pid } = instance;
    const pid = 'foo';
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
