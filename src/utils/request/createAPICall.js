// @flow
import type {
  FetchOpts,
  FetchType,
  Internals,
  ParsedFetchOpts,
  WrappedFetchType,
} from '../../clientTypes'

export type APICall<BodyType: $PropertyType<ParsedFetchOpts, 'body'> = void> = (
  body?: BodyType,
) => Promise<Response>

export const createAPICall = (fetch: FetchType) => <
  BodyType: $PropertyType<ParsedFetchOpts, 'body'>,
>(
  endpoint: string,
  options: FetchOpts = {},
): APICall<BodyType> => (body?: BodyType) =>
  fetch(endpoint, { ...options, body })

export const returnsJSON = <Args: Array<mixed>, R: *>(
  fn: (...Args) => Promise<Response>,
) => (...args: Args): Promise<R> =>
  fn(...args).then(response => response.json())
