import {equal} from 'assert';
import {readFileSync, writeFileSync} from 'fs';
import testServer, {testDecryptClient} from './server.mjs';
import test from 'testit';
import cjs from './server.js';
import browserify from 'browserify';
import browser from 'browser-run';
import concat from 'concat-stream';
const {
  testServer: testServerCJS,
  testDecryptClient: testDecryptClientCJS,
} = cjs;

const BROWSER_TEST_FILENAME = 'test-scripts/browser.js';

function setServerDataForClient(result) {
  const src = readFileSync(BROWSER_TEST_FILENAME, 'utf8');

  writeFileSync(
    BROWSER_TEST_FILENAME,
    src.split('// BEGIN_SERVER_INPUT')[0] +
      `// BEGIN_SERVER_INPUT\n` +
      `const SERVER_LOCKED = '${result.locked}';\n` +
      `const SERVER_CIPHERTEXT = '${result.ciphertext}';\n` +
      `// END_SERVER_INPUT` +
      src.split('// END_SERVER_INPUT')[1],
  );
}
test('test in server', async () => {
  const result = await testServer();
  if (!result.success) {
    throw new Error(result.message);
  }
  equal(result.success, true);
  equal(typeof result.locked, 'string');
  equal(typeof result.ciphertext, 'string');

  setServerDataForClient(result);
});

let locked;
let ciphertext;
test('test in browser', async () => {
  const log = await new Promise((resolve, reject) => {
    browserify(BROWSER_TEST_FILENAME)
      .bundle()
      .on('error', reject)
      .pipe(browser())
      .on('error', reject)
      .pipe(
        concat({encoding: 'string'}, (result) => {
          resolve(result);
        }),
      );
  });
  const result = JSON.parse(log);
  if (!result.success) {
    throw new Error(result.message);
  }
  equal(result.success, true);
  equal(typeof result.locked, 'string');
  equal(typeof result.ciphertext, 'string');
  locked = result.locked;
  ciphertext = result.ciphertext;
});

test('test decrypt value from client on server', async () => {
  const result = await testDecryptClient(locked, ciphertext);
  if (!result.success) {
    throw new Error(result.message);
  }
  equal(result.success, true);
});

test('test in server (cjs)', async () => {
  const result = await testServerCJS();
  if (!result.success) {
    throw new Error(result.message);
  }
  equal(result.success, true);
  equal(typeof result.locked, 'string');
  equal(typeof result.ciphertext, 'string');

  setServerDataForClient(result);
});

test('test in browser (using cjs node data)', async () => {
  const log = await new Promise((resolve, reject) => {
    browserify(BROWSER_TEST_FILENAME)
      .bundle()
      .on('error', reject)
      .pipe(browser())
      .on('error', reject)
      .pipe(
        concat({encoding: 'string'}, (result) => {
          resolve(result);
        }),
      );
  });
  const result = JSON.parse(log);
  if (!result.success) {
    throw new Error(result.message);
  }
  equal(result.success, true);
  equal(typeof result.locked, 'string');
  equal(typeof result.ciphertext, 'string');
  locked = result.locked;
  ciphertext = result.ciphertext;
});

test('test decrypt value from client on server (cjs)', async () => {
  const result = await testDecryptClientCJS(locked, ciphertext);
  if (!result.success) {
    throw new Error(result.message);
  }
  equal(result.success, true);
});

test('reset server data', () => {
  setServerDataForClient({locked: '<locked>', ciphertext: '<ciphertext>'});
});
