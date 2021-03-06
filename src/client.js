// @flow
import { throwIf } from 'fnional'

import { wrappedFetch } from './Methods/fetch'
import { storage as storageApi } from './Storage'
import { refreshToken as internalRefreshToken } from './Methods/refreshToken'
import { logIn as internalLogIn } from './Methods/logIn'
import { logOut as internalLogOut } from './Methods/logOut'
import { register as internalRegister } from './Methods/register'
import { confirmPassword as internalConfirmPassword } from './Methods/confirmPassword'
import { resetPassword as internalResetPassword } from './Methods/resetPassword'
import { validateConfig } from './config'
import { createHandler } from './utils/handler'
import { createAPICall, withMethod, returnsJSON } from './utils/request'

import type { Config } from './config'
import type {
  Client,
  ConfirmPWOpts,
  FetchOpts,
  Internals,
  LogInOpts,
  RegisterOpts,
  ResetPWOpts,
  ShortHandFetchOpts,
  Token,
  User,
} from './clientTypes'

let authChangeHandler
let clientConfig
let storage
let _token
let _user

type AuthObj = {
  user: User,
  token: Token,
}

const getStorageKey = () =>
  (clientConfig && clientConfig.storageKey) || 'IxorTalk Client'

const errorOnUninitialized = () =>
  throwIf(
    !isInitialized(),
    new Error(
      'The IxorTalk client was not yet initialized. Call "initialize" with your app\'s config first.',
    ),
  )

const retrieve = (): Promise<?{ user: User, token: Token }> => {
  errorOnUninitialized()
  if (storage) {
    return storage
      .getItem(getStorageKey())
      .then(values => (values ? JSON.parse(values) : null))
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
    } else {
      return storage.removeItem(key)
    }
  }
  return Promise.reject('No storage?')
}

const refreshAuth = async (auth: ?AuthObj): Promise<?AuthObj> => {
  if (!auth) return auth
  let { user, token } = auth
  try {
    token = await internalRefreshToken(token, getInternals(client))
    user = await me()
  } catch (e) {
    console.warn('Could not refresh user or token.', e)
    if (e.message.indexOf('Network request failed') !== -1) {
      token = auth.token
      user = auth.user
    } else {
      token = null
      user = null
    }
  } finally {
    if (!token || !user) {
      return null
    }
    return { user, token }
  }
}
const setAuth = async (auth: ?AuthObj) => {
  errorOnUninitialized()
  let notify = true

  if (auth && auth.user === _user) notify = false
  else if (auth === null && _user === null) notify = false

  if (authChangeHandler) {
    if (auth) {
      _user = auth.user
      _token = auth.token
    } else {
      _user = null
      _token = null
    }
    await persist()
    notify && authChangeHandler.trigger(_user)
  }
}
const setToken = async (token: ?Token) => {
  if (!token) _token = null
  else _token = token
  await persist()
}

const getInternals = (client: Client): Internals => {
  errorOnUninitialized()

  if (!clientConfig || !storage || !authChangeHandler) throw new Error()

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
    setToken,
    self: client,
    regenerateInternals: () => getInternals(client),
  }
}

const destroy = () => {
  authChangeHandler &&
    authChangeHandler.triggerError(new Error('Client destroyed.'))
  clientConfig = undefined
  storage = undefined
  authChangeHandler = undefined
  _user = undefined
  _token = undefined
}
const initialize = (config: Config) => {
  clientConfig = validateConfig(config)
  storage = storageApi
  authChangeHandler = createHandler(undefined)
  retrieve()
    .then(refreshAuth)
    .then(setAuth)
    .catch(console.warn)
}
// const initializeAsync = async () => {
//   errorOnUninitialized()
//   if (storage) {
//     const parsed = await retrieve()
//     await setAuth(parsed)
//   }
// }
const isInitialized = () => !!clientConfig && !!storage && !!authChangeHandler
const getAccessToken = () => (_token ? _token.accessToken : null)
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

const onAuthChange = (
  callback: (?User) => any,
  opts: ?{ emitCurrent?: boolean },
) => {
  errorOnUninitialized()
  if (!authChangeHandler) throw new Error()

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

const me = returnsJSON(createAPICall(fetch)('/uaa/user', { method: 'GET' }))

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
  get accessToken() {
    return getAccessToken()
  },
  onAuthChange,

  fetch,
  get,
  post,
  put,
  delete: _delete,
  patch,

  me,
}

export { client }
