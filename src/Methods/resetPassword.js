// @flow
import { throwingFetch } from '../utils/index'
import type { Internals, ResetPWOpts } from '../clientTypes'

const resetPassword = async (opts: ResetPWOpts, internals: Internals) => {
  await throwingFetch(
    `${internals.clientConfig.baseUrl}/uaa/api/account/reset_password/init`,
    {
      body: opts.email,
      method: 'POST',
      headers: {},
    },
  )
}

export { resetPassword }
