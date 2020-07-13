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

test('test in server', async () => {
  const result = await testServer();
  if (!result.success) {
    throw new Error(result.message);
  }
  equal(result.success, true);
  equal(typeof result.locked, 'string');
  equal(typeof result.ciphertext, 'string');

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
