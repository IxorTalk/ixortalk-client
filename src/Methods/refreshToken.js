// @flow
import {basicAuth, throwingFetch} from '../utils/index'
import {createToken} from '../createToken'
import type {Internals, Token} from '../clientTypes'

const refresh = async (token: Token, internals: Internals) => {
  const body = new FormData()
  body.append('refresh_token', token.refreshToken)
  body.append('grant_type', 'refresh_token')
  
  const response = await throwingFetch(`${internals.clientConfig.baseUrl}/uaa/oauth/token`, {
    body,
    method: 'POST',
    headers: {
      'Authorization': basicAuth(internals.clientConfig.clientId, internals.clientConfig.clientSecret),
    },
  })
  
  const tokenResponse = await response.json()
  const newToken = createToken(tokenResponse)
  // TODO save new token
  return newToken
}

let currentPromise

const syncedRefresh = (token: Token, internals: Internals) => {
  if (!currentPromise)
    currentPromise = refresh(token, internals)
  return currentPromise
}

export const refreshToken = syncedRefresh
