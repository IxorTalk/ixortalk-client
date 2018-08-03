// @flow
import {throwIf} from 'fnional'

import {wrappedFetch} from './Methods/fetch'
import {storage as storageApi} from './Storage'
import {logIn as internalLogIn} from './Methods/logIn'
import {logOut as internalLogOut} from './Methods/logOut'
import {register as internalRegister} from './Methods/register'
import {confirmPassword as internalConfirmPassword} from './Methods/confirmPassword'
import {resetPassword as internalResetPassword} from './Methods/resetPassword'
import {validateConfig} from './config'
import {createHandler} from './utils/handler'
import {createAPICall, withMethod} from './utils/request'

import type {Config} from './config'
import type {
  Client, ConfirmPWOpts, FetchOpts, Internals, LogInOpts, RegisterOpts, ResetPWOpts, ShortHandFetchOpts,
  Token, User,
} from './clientTypes'

let authChangeHandler
let clientConfig
let storage
let _token
let _user

const getStorageKey = () => (clientConfig && clientConfig.storageKey) || 'IxorTalk Client'

const errorOnUninitialized = () => throwIf(!isInitialized(), new Error('The IxorTalk client was not yet initialized. Call "initialize" with your app\'s config first.'))

const retrieve = (): Promise<?{ user: User, token: Token }> => {
  errorOnUninitialized()
  if (storage) {
    return storage.getItem(getStorageKey())
      .then(values => values ? JSON.parse(values) : null)
  }
  return Promise.reject('No storage?')
}
const persist = (): Promise<void> => {
  errorOnUninitialized()
  if (storage) {
    const key = getStorageKey()
    if (_token && _user) {
      const value = JSON.stringify({
          token: _token,
          user: _user,
        })
      return storage.setItem(key, value)
    }
    else {
      return storage.removeItem(key)
    }
  }
  return Promise.reject('No storage?')
}

const setAuth = async (auth: ?{ token: Token, user: User }) => {
  errorOnUninitialized()
  if (authChangeHandler) {
    if (auth) {
      _user = auth.user
      _token = auth.token
    }
    else {
      _user = null
      _token = null
    }
    await persist()
    authChangeHandler.trigger(_user)
  }
}

const getInternals = (client: Client): Internals => {
  errorOnUninitialized()
  
  if (!clientConfig || !storage || !authChangeHandler)
    throw new Error()
  
  return {
    clientConfig,
    storage,
    get token() {
      return _token
    },
    get currentUser() {
      return _user
    },
    setAuth,
    self: client,
  }
}

const destroy = () => {
  clientConfig = undefined
  storage = undefined
  authChangeHandler = undefined
}
const initialize = (config: Config) => {
  clientConfig = validateConfig(config)
  storage = storageApi
  authChangeHandler = createHandler(undefined)
  
  retrieve()
    .then(setAuth)
}
// const initializeAsync = async () => {
//   errorOnUninitialized()
//   if (storage) {
//     const parsed = await retrieve()
//     await setAuth(parsed)
//   }
// }
const isInitialized = () => !!clientConfig && !!storage && !!authChangeHandler
const getCurrentUser = () => _user

const logIn = (args: LogInOpts) => {
  errorOnUninitialized()
  return internalLogIn(args, getInternals(client))
}
const logOut = () => {
  errorOnUninitialized()
  return internalLogOut(getInternals(client))
}
const register = (args: RegisterOpts) => {
  errorOnUninitialized()
  return internalRegister(args, getInternals(client))
}
const confirmPassword = (args: ConfirmPWOpts) => {
  errorOnUninitialized()
  return internalConfirmPassword(args, getInternals(client))
}
const resetPassword = (args: ResetPWOpts) => {
  errorOnUninitialized()
  return internalResetPassword(args, getInternals(client))
}

const onAuthChange = (callback: (?User) => any, opts: ?{ emitCurrent?: boolean }) => {
  errorOnUninitialized()
  if (!authChangeHandler)
    throw new Error()
  
  return authChangeHandler.add(callback, opts)
  
}

const fetch = (endpoint: string, args?: FetchOpts = {}) => {
  errorOnUninitialized()
  return wrappedFetch(endpoint, args, getInternals(client))
}
const get = (endpoint: string, args?: ShortHandFetchOpts = {}) => {
  return fetch(endpoint, withMethod(args, 'GET'))
}
const post = (endpoint: string, args?: ShortHandFetchOpts = {}) => {
  return fetch(endpoint, withMethod(args, 'POST'))
}
const put = (endpoint: string, args?: ShortHandFetchOpts = {}) => {
  return fetch(endpoint, withMethod(args, 'PUT'))
}
const _delete = (endpoint: string, args?: ShortHandFetchOpts = {}) => {
  return fetch(endpoint, withMethod(args, 'DELETE'))
}
const patch = (endpoint: string, args?: ShortHandFetchOpts = {}) => {
  return fetch(endpoint, withMethod(args, 'PATCH'))
}

const me = createAPICall(fetch)('/uaa/user', {method: 'GET'})

const client: Client = {
  destroy,
  initialize,
  get isInitialized() {
    return isInitialized()
  },
  logIn,
  logOut,
  register,
  confirmPassword,
  resetPassword,
  
  get currentUser() {
    return getCurrentUser()
  },
  onAuthChange,
  
  fetch,
  get,
  post,
  put,
  'delete': _delete,
  patch,
  
  me,
}

export {client}
