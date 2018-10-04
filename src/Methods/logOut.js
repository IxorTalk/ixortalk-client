// @flow
import type { Internals } from '../clientTypes'
import { throwingFetch } from '../utils/request'
import { wrappedFetch } from './fetch'

const logOut = async (internals: Internals) => {
  const token = internals.token
  if (!token) throw new Error('You are not logged in at this time.')

  try {
    await wrappedFetch('/logout', {}, internals)
  } catch (e) {
    console.log('Log out call failed. Still removing token.', e)
  }
  await internals.setAuth(null)
}

export { logOut }
