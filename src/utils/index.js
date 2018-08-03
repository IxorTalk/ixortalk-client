// @flow
import { encode } from 'base-64'
import type {Token} from '../clientTypes'

export * from './FetchError'
export * from './request'
export * from './handler'

//!\ warning /!\  local time is not indicative of server time
export const hasExpired = (token: Token) => token.expiryTime < Math.floor(Date.now() / 1000)
export const basicAuth = (id: string, secret: string) => `Basic ${encode(`${id}:${secret}`)}`

