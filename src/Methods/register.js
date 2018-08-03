// @flow
import {throwingFetch} from '../utils/index'
import type {Internals, RegisterOpts} from '../clientTypes'

const register = async (opts: RegisterOpts, internals: Internals) => {
  const body = JSON.stringify({
    username: opts.email,
    firstName: opts.firstName,
    lastName: opts.lastName,
    langKey: opts.langKey,
  })

  await throwingFetch(`${internals.clientConfig.baseUrl}/user-registration`, {
    body,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
  })
}

export {register}
