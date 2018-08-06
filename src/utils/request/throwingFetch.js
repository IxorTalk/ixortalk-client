// @flow
import { FetchError } from '../FetchError';
import type { ParsedFetchOpts } from '../../clientTypes';

export const throwingFetch = async (
  endpoint: string,
  opts: ParsedFetchOpts,
) => {
  const response = await fetch(endpoint, opts);

  if (response.ok) return response;
  else {
    let text = null;
    try {
      text = await response.text();
    } catch (e) {
      text = '';
    }
    throw new FetchError(response, text);
  }
};
