import Opaque from 'ts-opaque';
import {Environment, Salt} from './types';

export {Salt};
export type Pbkdf2Key = Opaque<{}, 'Pbkdf2Key'>;

throw new Error('If you are importing this module, the bundler has failed');

declare const environment: Environment<Pbkdf2Key>;
export default environment;
