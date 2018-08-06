// @flow

import type {
  FetchOpts,
  Internals,
  MethodEnum,
  ParsedFetchOpts,
} from '../../clientTypes';

const validBodyOrNull = (body: any): ?$PropertyType<RequestOptions, 'body'> => {
  if (
    !body ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    typeof body === 'string' ||
    body instanceof DataView
  )
    return body;

  return null;
};
const addHeader = (headers: ?{} | Headers = {}, key: string, value: string) => {
  if (headers instanceof Headers) {
    headers.append(key, value);
    return headers;
  }
  return { ...headers, [key]: value };
};
const parseOpts = (opts: FetchOpts, internals: Internals): ParsedFetchOpts => {
  let headers = opts.headers || {};
  let method = opts.method || 'GET';
  let body: $PropertyType<RequestOptions, 'body'> = null;

  if (internals.token) {
    const authorization = `Bearer ${internals.token.accessToken}`;
    headers = addHeader(headers, 'Authorization', authorization);
  }

  if (opts.body !== null && opts.body !== undefined) {
    if (
      typeof opts.body === 'object' &&
      Object.getPrototypeOf(opts.body) === Object.getPrototypeOf({})
    ) {
      body = JSON.stringify(opts.body);
      headers = addHeader(headers, 'Content-Type', 'application/json');
    } else body = validBodyOrNull(opts.body);
  }

  return {
    ...opts,
    headers,
    body,
    method,
  };
};

const withMethod = (opts: FetchOpts = {}, method: MethodEnum): FetchOpts => ({
  ...opts,
  method,
});

export { parseOpts, withMethod };
