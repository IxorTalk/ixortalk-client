// @flow
import { refreshToken } from './refreshToken'
import { hasExpired, throwingFetch } from '../utils/index'
import type { FetchOpts, Internals, Token } from '../clientTypes'
import { parseOpts } from '../utils'

const baseUrlRegxp = /(^https?:\/\/[a-z0-9\-]+\.(?:[a-z0-9\-_]+\.?)+\/?)/
const wrappedFetch = async (
  endpoint: string,
  opts?: FetchOpts = {},
  internals: Internals,
) => {
  let token = internals.token

  if (token) {
    if (hasExpired(token)) token = await refreshToken(token, internals)
  }

  try {
    return await innerCall(endpoint, opts, internals)
  } catch (e) {
    // Try with a new token
    if (e.status === 401 && token) {
      console.log('retrying')
      await refreshToken(token, internals)
      const newInternals: Internals = internals.regenerateInternals()
      return innerCall(endpoint, opts, newInternals)
    } else {
      throw e
    }
  }
}

const innerCall = (endpoint: string, opts: FetchOpts, internals: Internals) => {
  const parsedOpts = parseOpts(opts, internals)

  let _endpoint = endpoint.replace(internals.clientConfig.baseUrl, '')
  if (baseUrlRegxp.test(_endpoint))
    throw new URIError('Expecting an endpoint from a platform, not a full URL.')

  const fullUrl = `${internals.clientConfig.baseUrl}${_endpoint}`
  return throwingFetch(fullUrl, parsedOpts)
}

export { wrappedFetch }
