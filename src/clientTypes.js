// @flow
import type { Config } from './config';
import type { Storage } from './Storage/createStorage';
import type { Handler } from './utils';
import type { APICall } from './utils/request';

export type User = {
  name: string,
  firstName: string,
  lastName: string,
  langKey: string,
};
export type TokenResponse = {
  access_token: string,
  refresh_token: string,
  expires_in: number,
};
export type Token = {
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  expiryTime: number,
};
export type LogInOpts = {
  email: string,
  password: string,
};
export type LogOutOpts = void;
export type RegisterOpts = {
  email: string,
  firstName: string,
  lastName: string,
  langKey: string,
};
export type ConfirmPWOpts = {
  key: string,
  password: string,
};
export type ResetPWOpts = {
  email: string,
};

export type MethodEnum = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ParsedFetchOpts = RequestOptions;
type CustomFetchOpts = {|
  body?: $PropertyType<ParsedFetchOpts, 'body'> | Object,
  method?: MethodEnum,
  headers?: Headers | { [string]: string },
|};
export type FetchOpts = {
  ...ParsedFetchOpts,
  ...CustomFetchOpts,
};
export type ShortHandFetchOpts = $Diff<
  FetchOpts,
  { method?: $PropertyType<FetchOpts, 'method'> },
>;

export type FetchType = (
  resource: string,
  opts?: FetchOpts,
  internals?: any,
) => Promise<Response>;
export type WrappedFetchType = (
  resource: string,
  opts?: FetchOpts,
  internals: Internals,
) => Promise<Response>;
export type ShortHandFetchType = (
  resource: string,
  opts?: ShortHandFetchOpts,
) => Promise<Response>;

export type Internals = {|
  clientConfig: Config,
  storage: Storage,
  token: ?Token,
  currentUser: ?User,
  setAuth: (?{ user: User, token: Token }) => Promise<void>,
  setToken: (?Token) => Promise<void>,
  self: Client,
  regenerateInternals: () => Internals,
|};

export interface Client {
  +isInitialized: boolean;
  initialize(Config): void;
  destroy(): void;
  logIn(LogInOpts): Promise<User>;
  logOut(LogOutOpts): Promise<void>;
  register(RegisterOpts): Promise<void>;
  confirmPassword(ConfirmPWOpts): Promise<void>;
  resetPassword(ResetPWOpts): Promise<void>;

  +currentUser: ?User;
  +accessToken: ?string,
  onAuthChange: $PropertyType<Handler<?User>, 'add'>;

  me: APICall<>;

  fetch: FetchType;
  get: ShortHandFetchType;
  post: ShortHandFetchType;
  put: ShortHandFetchType;
  delete: ShortHandFetchType;
  patch: ShortHandFetchType;
}
