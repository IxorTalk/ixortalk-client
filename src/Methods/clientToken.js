// @flow
import {basicAuth, throwingFetch} from '../utils/index'
import type {Internals, Token} from '../clientTypes'
import {createToken} from '../createToken'

const clientToken = async (internals: Internals): Promise<Token> => {
  const body = new FormData()
  body.append('grant_type', 'client_credentials')
  const tokenResponse = await throwingFetch(`${internals.clientConfig.baseUrl}/uaa/oauth/token`, {
    body,
    method: 'POST',
    headers: {
      'Authorization': basicAuth(internals.clientConfig.clientId, internals.clientConfig.clientSecret),
    },
  })
  const token = await tokenResponse.json()
  return createToken(token)
}

export {clientToken}
