// @flow
import type { Token, TokenResponse } from './clientTypes';

const createToken = (tokenResponse: TokenResponse): Token => {
  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresIn: tokenResponse.expires_in,
    expiryTime: Math.floor(Date.now() / 1000) + tokenResponse.expires_in,
  };
};

export { createToken };
