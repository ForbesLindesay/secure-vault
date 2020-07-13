import ServerEnvironment from '../server';
import {password, secretData, secretDataToString} from '../../utils/types';

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
