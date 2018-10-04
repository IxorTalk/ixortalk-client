// @flow
import { throwingFetch } from '../utils/index'
import type { ConfirmPWOpts, Internals } from '../clientTypes'

const confirmPassword = async (opts: ConfirmPWOpts, internals: Internals) => {
  const body = JSON.stringify({
    key: opts.key,
    newPassword: opts.password,
  })
  await throwingFetch(
    `${internals.clientConfig.baseUrl}/uaa/api/account/reset_password/finish`,
    {
      body,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}

export { confirmPassword }
