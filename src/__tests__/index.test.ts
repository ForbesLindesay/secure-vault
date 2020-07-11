import {readFileSync, writeFileSync} from 'fs';
import testServer, {testDecryptClient} from './test-server';
const browserify = require('browserify');
const browser = require('browser-run');
const concat = require('concat-stream');

const BROWSER_TEST_FILENAME =
  __dirname + '/../../lib/__tests__/test-browser.js';

test('test in server', async () => {
  const result = await testServer();
  if (!result.success) {
    throw new Error(result.message);
  }
  expect(result).toEqual({
    success: true,
    locked: expect.any(String),
    ciphertext: expect.any(String),
  });

  const src = readFileSync(BROWSER_TEST_FILENAME, 'utf8');
  writeFileSync(
    BROWSER_TEST_FILENAME,
    src
      .split('<SERVER_LOCKED>')
      .join(result.locked)
      .split('<SERVER_CIPHERTEXT>')
      .join(result.ciphertext),
  );
});

let locked: string | undefined;
let ciphertext: string | undefined;
test('test in browser', async () => {
  const log = await new Promise<string>((resolve, reject) => {
    browserify(BROWSER_TEST_FILENAME)
      .bundle()
      .on('error', reject)
      .pipe(browser())
      .on('error', reject)
      .pipe(
        concat({encoding: 'string'}, (result: any) => {
          resolve(result);
        }),
      );
  });
  const result = JSON.parse(log);
  if (!result.success) {
    throw new Error(result.message);
  }
  expect(result).toEqual({
    success: true,
    locked: expect.any(String),
    ciphertext: expect.any(String),
  });
  locked = result.locked;
  ciphertext = result.ciphertext;
});

test('test decrypt value from client on server', async () => {
  const result = await testDecryptClient(locked!, ciphertext!);
  if (!result.success) {
    throw new Error(result.message);
  }
  expect(result).toEqual({
    success: true,
  });
});
