import ServerEnvironment from '../server';
import {password, secretData, secretDataToString} from '../../types';
import {PBKDF2_ITERATIONS} from '../../constants';

jest.setTimeout(10_000);
test('ServerEnvironment', async () => {
  const key = await ServerEnvironment.getKey(
    password('Hello World'),
    ServerEnvironment.getSalt(),
    {iterations: 100000},
  );
  const encrypted = await ServerEnvironment.encrypt(
    key,
    secretData('Hello World'),
  );
  const decrypted = secretDataToString(
    await ServerEnvironment.decrypt(key, encrypted),
  );
  expect(decrypted).toBe('Hello World');
});

test('ServerEnvironment', async () => {
  const start = Date.now();
  for (let i = 0; i < 10; i++) {
    await ServerEnvironment.getKey(
      password('Hello World'),
      ServerEnvironment.getSalt(),
      {iterations: PBKDF2_ITERATIONS},
    );
  }
  const end = Date.now();
  expect(end - start).toBeGreaterThan(500);
});
