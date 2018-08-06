// @flow
type UnsureConfig = {
  baseUrl?: string,
  clientId?: string,
  clientSecret?: string,
  storageKey?: ?string,
};
export type Config = {
  baseUrl: string,
  clientId: string,
  clientSecret: string,
  storageKey?: ?string,
};

const validateConfig = (config: Config): Config => {
  if (!config.baseUrl || typeof config.baseUrl !== 'string')
    throw TypeError('Expected "config.baseUrl" to be a string.');
  const baseUrl: string = config.baseUrl;

  if (!config.clientId || typeof config.clientId !== 'string')
    throw TypeError('Expected "config.clientId" to be a string.');
  const clientId: string = config.clientId;

  if (!config.clientSecret || typeof config.clientSecret !== 'string')
    throw TypeError('Expected "config.clientSecret" to be a string.');
  const clientSecret: string = config.clientSecret;

  if (config.storageKey && typeof config.storageKey !== 'string')
    throw TypeError(
      'Expected "config.storageKey" to be undefined, null or a string.',
    );
  const storageKey: ?string = config.storageKey;

  return {
    baseUrl,
    clientId,
    clientSecret,
    storageKey,
  };
};
export { validateConfig };
