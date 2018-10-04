// @flow
import { basicAuth, throwingFetch } from '../utils/index'
import type { Internals, LogInOpts, User } from '../clientTypes'
import { createToken } from '../createToken'

const logIn = async (opts: LogInOpts, internals: Internals): Promise<User> => {
  const body = new FormData()
  body.append('username', opts.email)
  body.append('password', opts.password)
  body.append('grant_type', 'password')
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
  const token = createToken(tokenResponse)

  const userResponse = await throwingFetch(
    `${internals.clientConfig.baseUrl}/uaa/user`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    },
  )
  const user = await userResponse.json()
  await internals.setAuth({ token, user })

  return user
}

export { logIn }
