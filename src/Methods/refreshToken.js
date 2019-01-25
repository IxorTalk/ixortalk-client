// @flow
import { basicAuth, throwingFetch } from '../utils/index'
import { createToken } from '../createToken'
import type { Internals, Token } from '../clientTypes'

let currentPromise

const refresh = async (token: Token, internals: Internals) => {
  const body = new FormData()
  body.append('refresh_token', token.refreshToken)
  body.append('grant_type', 'refresh_token')

  try {
    const response = await throwingFetch(
      `${internals.clientConfig.baseUrl}/uaa/oauth/token`,
      {
        body,
        method: 'POST',
        headers: {
          Authorization: basicAuth(
            internals.clientConfig.clientId,
            internals.clientConfig.clientSecret,
          ),
        },
      },
    )

    const tokenResponse = await response.json()
    const newToken = createToken(tokenResponse)
    await internals.setToken(newToken)
    return newToken
  } catch (e) {
    await internals.self.logOut()
    throw new Error('Logged out: Could not refresh token.')
  }
}

const syncedRefresh = (token: Token, internals: Internals): Promise<Token> => {
  if (!currentPromise)
    currentPromise = refresh(token, internals)
      .then(a => {
        currentPromise = null
        return Promise.resolve(a)
      })
      .catch(e => {
        currentPromise = null
        return Promise.reject(e)
      })

  return currentPromise
}

export const refreshToken = syncedRefresh
