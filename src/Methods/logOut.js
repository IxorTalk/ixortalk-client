// @flow
import type {Internals} from '../clientTypes'
import {throwingFetch} from '../utils/request'
import {wrappedFetch} from './fetch'

const logOut = async (internals: Internals) => {
  const token = internals.token
  if (!token)
    throw new Error('You are not logged in at this time.')
  
  await wrappedFetch('/logout', {}, internals)
  await internals.setAuth(null)
}

export {logOut}
