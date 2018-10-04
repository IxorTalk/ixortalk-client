// @flow
import { client } from './client'
export default client
export const {
  isInitialized,
  initialize,
  logIn,
  logOut,
  register,
  resetPassword,
  confirmPassword,

  onAuthChange,

  fetch,
  get,
  post,
  put,
  patch,
  delete: delete_,

  me,
} = client
