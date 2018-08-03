// @flow
import type {FetchOpts, FetchType, Internals, ParsedFetchOpts, WrappedFetchType} from '../../clientTypes'

export type APICall<BodyType: $PropertyType<ParsedFetchOpts, 'body'> = void> =
  (body?: BodyType) => Promise<Response>

export const createAPICall = (fetch: FetchType) =>
  <BodyType: $PropertyType<ParsedFetchOpts, 'body'>>(endpoint: string, options: FetchOpts = {}): APICall<BodyType> =>
    (body?: BodyType) =>
      fetch(endpoint, {...options, body})
