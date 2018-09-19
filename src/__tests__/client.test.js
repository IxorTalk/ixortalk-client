// @flow
import 'whatwg-fetch';
import fetchMock from 'fetch-mock';
import client from '../index';
import type { Config } from '../config';
import { basicAuth, FetchError } from '../utils';
import { createToken } from '../createToken';

fetchMock.config = Object.assign(fetchMock.config, {
  Headers,
  Request,
  Response,
});
describe('client', () => {
  const config: Config = {
    baseUrl: 'https://test.ixortalk.com',
    clientId: 'jest',
    clientSecret: 'jestSecret',
  };
  const mockResponseToken = {
    access_token: 'accesstoken',
    refresh_token: 'refreshtoken',
    expires_in: 123,
  };
  const mockUser = {
    username: 'admin@ixortalk.com',
    firstName: 'Admin',
    lastName: 'Admin',
    langKey: 'en',
  };

  const mockLogin = () => {
    fetchMock.post(`${config.baseUrl}/uaa/oauth/token`, mockResponseToken);
    fetchMock.get(`${config.baseUrl}/uaa/user`, mockUser);
  };
  const loginAndMockLogin = async () => {
    mockLogin();
    await client.logIn({ email: 'admin@ixortalk.com', password: 'admin' });
  };

  describe('initialization', () => {
    beforeEach(() => {
      client.destroy();
    });
    test('Throws errors when not initialized', () => {
      expect(() =>
        client.logIn({ email: 'admin@ixortalk.com', password: 'admin' }),
      ).toThrow(Error);
    });
    test('Gets initialized', () => {
      client.initialize(config);
      expect(client.isInitialized).toEqual(true);
    });
    test('Throws an error if required config is faulty', () => {
      expect(
        //$FlowFixMe this is on purpose!
        () => client.initialize({ ...config, baseUrl: 123 }),
      ).toThrow(TypeError);
      expect(
        //$FlowFixMe this is on purpose!
        () => client.initialize({ ...config, clientId: 123 }),
      ).toThrow(TypeError);
      expect(
        //$FlowFixMe this is on purpose!
        () => client.initialize({ ...config, clientSecret: 123 }),
      ).toThrow(TypeError);
    });
  });

  const reinitialize = async () => {
    fetchMock.restore();
    localStorage.clear();
    client.destroy();
    client.initialize(config);
  };

  describe('logging in', () => {
    beforeEach(reinitialize);

    test('logs in correctly', async () => {
      fetchMock.post(`${config.baseUrl}/uaa/oauth/token`, mockResponseToken);
      fetchMock.get(`${config.baseUrl}/uaa/user`, mockUser);

      const user = await client.logIn({
        email: 'admin@ixortalk.com',
        password: 'admin',
      });

      const [tokenEndpoint, tokenOpts] = fetchMock.lastCall(
        `${config.baseUrl}/uaa/oauth/token`,
        'POST',
      );
      const body: FormData = tokenOpts.body;
      expect(body.get('username')).toEqual('admin@ixortalk.com');
      expect(body.get('password')).toEqual('admin');
      expect(body.get('grant_type')).toEqual('password');
      expect(tokenOpts.headers['Authorization']).toEqual(
        basicAuth(config.clientId, config.clientSecret),
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'IxorTalk Client',
        JSON.stringify({
          token: createToken(mockResponseToken),
          user: mockUser,
        }),
      );
      expect(user).toEqual(mockUser);

      const [userEndpoint, userOpts] = fetchMock.lastCall(
        `${config.baseUrl}/uaa/user`,
        'GET',
      );
      expect(userOpts.headers['Authorization']).toEqual(
        `Bearer ${mockResponseToken.access_token}`,
      );
    });
  });
  describe('logging out', () => {
    beforeEach(reinitialize);

    test('Throws an error when not logged in', async () => {
      let error;
      try {
        await client.logOut();
      } catch (e) {
        error = e;
      }
      expect(error).toEqual(new Error('You are not logged in at this time.'));
    });

    test('logs out correctly', async () => {
      await loginAndMockLogin();
      fetchMock.get(`${config.baseUrl}/logout`, 200);

      await client.logIn({ email: 'admin@ixortalk.com', password: 'admin' });
      await client.logOut();

      expect(localStorage.removeItem).toHaveBeenCalledWith('IxorTalk Client');
      expect(fetchMock.called(`${config.baseUrl}/logout`)).toEqual(true);
    });
  });
  describe('Registering', () => {
    beforeEach(reinitialize);

    test('does the user registration call correctly', async () => {
      fetchMock.post(`${config.baseUrl}/user-registration`, 200);

      const user = {
        email: 'admin@ixortalk.com',
        firstName: 'admin',
        lastName: 'admin',
        langKey: 'en',
      };
      await client.register(user);

      const [endpoint, opts] = fetchMock.lastCall(
        `${config.baseUrl}/user-registration`,
        'POST',
      );
      expect(opts.headers['Content-Type']).toEqual('application/json');
      expect(JSON.parse(opts.body)).toEqual({
        username: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        langKey: user.langKey,
      });
    });
  });

  describe('confirming password', () => {
    beforeEach(reinitialize);

    test('successfully set the password', async () => {
      fetchMock.post(
        `${config.baseUrl}/uaa/api/account/reset_password/finish`,
        200,
      );

      await client.confirmPassword({
        key: '123-this-is-a-key',
        password: 'admin',
      });

      const [endpoint, opts] = fetchMock.lastCall(
        `${config.baseUrl}/uaa/api/account/reset_password/finish`,
        'POST',
      );

      expect(opts.headers['Content-Type']).toEqual('application/json')
      expect(JSON.parse(opts.body)).toEqual({
        key: '123-this-is-a-key',
        newPassword: 'admin',
      });
    });
  });
  describe('reset password', () => {
    beforeEach(reinitialize);

    test('successfully request a reset', async () => {
      fetchMock.post(
        `${config.baseUrl}/uaa/api/account/reset_password/init`,
        200,
      );

      await client.resetPassword({ email: 'admin@ixortalk.com' });

      const [endpoint, opts] = fetchMock.lastCall(
        `${config.baseUrl}/uaa/api/account/reset_password/init`,
        'POST',
      );
      expect(opts.body).toEqual('admin@ixortalk.com');
    });
  });

  describe('currentUser', () => {
    beforeEach(reinitialize);

    test('contains null when there is no logged in user', async () => {
      expect(client.currentUser).toEqual(null);
    });
    test('contains the current user when logged in', async () => {
      await loginAndMockLogin();
      expect(client.currentUser).toEqual(mockUser);
    });
  });

  describe('onAuthChange', () => {
    beforeEach(reinitialize);

    test('Correctly fires callbacks when a log-in occurs', async () => {
      const handler = jest.fn();

      client.onAuthChange(handler);

      await loginAndMockLogin();

      expect(fetchMock.called(`${config.baseUrl}/uaa/oauth/token`)).toEqual(
        true,
      );
      expect(handler.mock.calls[0]).toEqual([mockUser]);
    });
    test('Calls callback with the current state when option is passed', async () => {
      await loginAndMockLogin();
      fetchMock.get(`${config.baseUrl}/logout`, 200);
      const handler = jest.fn();

      client.onAuthChange(handler, { emitCurrent: true });

      expect(handler.mock.calls[0]).toEqual([mockUser]);

      await client.logOut();

      expect(handler.mock.calls[1]).toEqual([null]);
    });
    test('Correctly fires callbacks when a log-out occurs', async () => {
      await loginAndMockLogin();
      fetchMock.get(`${config.baseUrl}/logout`, 200);

      const handler = jest.fn();

      await client.logIn({ email: 'admin@ixortalk.com', password: 'admin' });
      client.onAuthChange(handler);
      await client.logOut();

      expect(fetchMock.called(`${config.baseUrl}/logout`)).toEqual(true);
      expect(handler.mock.calls[0]).toEqual([null]);
    });
  });

  describe('fetch', () => {
    beforeEach(reinitialize);

    test('Fetches from an endpoint of the configurated platform and returns a "Response" object.', async () => {
      const body = { someProperty: 'someValue' };
      fetchMock.get(`${config.baseUrl}/my-resource`, body);

      const result = await client.fetch('/my-resource');
      const resultBody = await result.json();

      expect(fetchMock.called(`${config.baseUrl}/my-resource`)).toEqual(true);
      expect(result).toBeInstanceOf(Response);
      expect(result.ok).toEqual(true);
      expect(result.status).toEqual(200);
      expect(result.statusText).toEqual('OK');
      expect(resultBody).toEqual(body);
    });

    test('Does a "POST"-request with body', async () => {
      const body = { someProperty: 'someValue' };
      fetchMock.post(`${config.baseUrl}/my-resource`, 200);

      const result = await client.fetch('/my-resource', {
        method: 'POST',
        body,
      });

      const [endpoint, opts] = fetchMock.lastCall(
        `${config.baseUrl}/my-resource`,
        'POST',
      );

      expect(fetchMock.called(`${config.baseUrl}/my-resource`)).toEqual(true);
      expect(opts.body).toEqual('{"someProperty":"someValue"}');
      expect(result).toBeInstanceOf(Response);
      expect(result.ok).toEqual(true);
      expect(result.status).toEqual(200);
    });
    test('Does a "POST"-request with empty object body', async () => {
      const body = {};
      fetchMock.post(`${config.baseUrl}/my-resource`, 200);

      const result = await client.fetch('/my-resource', {
        method: 'POST',
        body,
      });

      const [endpoint, opts] = fetchMock.lastCall(
        `${config.baseUrl}/my-resource`,
        'POST',
      );

      expect(fetchMock.called(`${config.baseUrl}/my-resource`)).toEqual(true);
      expect(opts.body).toEqual('{}');
      expect(result).toBeInstanceOf(Response);
      expect(result.ok).toEqual(true);
      expect(result.status).toEqual(200);
    });

    test('Injects the token if someone is logged in.', async () => {
      await loginAndMockLogin();
      const body = { someProperty: 'someValue' };
      fetchMock.get(`${config.baseUrl}/my-auth-resource`, body);

      const result = await client.fetch('/my-auth-resource');
      const resultBody = await result.json();

      const [endpoint, opts] = fetchMock.lastCall(
        `${config.baseUrl}/my-auth-resource`,
      );
      expect(opts.headers['Authorization']).toEqual(
        `Bearer ${createToken(mockResponseToken).accessToken}`,
      );
      expect(resultBody).toEqual(body);
    });

    test('Returns a "FetchError" on failed requests', async () => {
      fetchMock.get(`${config.baseUrl}/my-404-resource`, 404);
      let error;
      try {
        await client.fetch('/my-404-resource');
      } catch (e) {
        error = e;
      }
      expect(error)
        // Can't test for instanceof FetchError due to Babel limitations
        .toBeInstanceOf(Error);
      //$FlowFixMe
      expect(error.status).toEqual(404);

      console.log(error);
      //$FlowFixMe
      expect(error.name).toEqual('Fetch Error: 404');
    });
  });

  describe('Fetch shorthands', () => {
    beforeEach(reinitialize);

    describe('get', () => {
      test('does a request with method "GET"', async () => {
        const body = { myProperty: 'myValue' };
        fetchMock.get(`${config.baseUrl}/objects/someId`, body);

        const result = await client.get('/objects/someId');
        const resultBody = await result.json();

        const [endpoint, opts] = fetchMock.lastCall(
          `${config.baseUrl}/objects/someId`,
        );
        expect(opts.method).toEqual('GET');
        expect(resultBody).toEqual(body);
      });
    });
    describe('post', () => {
      test('does a request with method "POST".', async () => {
        fetchMock.post(`${config.baseUrl}/objects`, 201);

        const result = await client.post('/objects');

        const [endpoint, opts] = fetchMock.lastCall(
          `${config.baseUrl}/objects`,
        );
        expect(opts.method).toEqual('POST');
        expect(result.status).toEqual(201);
      });
    });
    describe('put', () => {
      test('does a request with method "PUT"', async () => {
        const object = { myProperty: 'myEditedValue' };
        fetchMock.put(`${config.baseUrl}/objects/someId`, object);

        const result = await client.put('/objects/someId', { body: object });
        const resultBody = await result.json();

        const [endpoint, opts] = fetchMock.lastCall(
          `${config.baseUrl}/objects/someId`,
        );
        expect(opts.method).toEqual('PUT');
        expect(resultBody).toEqual(object);
      });
    });
    describe('delete', () => {
      test('does a request with method "DELETE"', async () => {
        fetchMock.delete(`${config.baseUrl}/objects/someId`, 204);

        const result = await client.delete('/objects/someId');

        const [endpoint, opts] = fetchMock.lastCall(
          `${config.baseUrl}/objects/someId`,
        );
        expect(opts.method).toEqual('DELETE');
        expect(result.status).toEqual(204);
      });
    });
    describe('patch', () => {
      test('does a request with method "PATCH"', async () => {
        const object = { someProperty: 'somePatchedValue' };
        fetchMock.patch(`${config.baseUrl}/objects/someId`, object);

        const result = await client.patch('/objects/someId');
        const resultBody = await result.json();

        const [endpoint, opts] = fetchMock.lastCall(
          `${config.baseUrl}/objects/someId`,
        );
        expect(opts.method).toEqual('PATCH');
        expect(resultBody).toEqual(object);
      });
    });
  });
  describe('tokens', () => {
    beforeEach(reinitialize);
    test('refresh and persist when a "401"-response is returned', async () => {
      const body = {test: 'test'}
      await loginAndMockLogin();
      fetchMock.get(`${config.baseUrl}/objects/someId`, {status: 401, body: 'invalid_token'}, {repeat: 1});
      fetchMock.get(`${config.baseUrl}/objects/someId`, body, {overwriteRoutes: false});
      
      const response = await client.get('/objects/someId')
      const responseBody = await response.json()
      
      const getCalls = fetchMock.calls(`${config.baseUrl}/objects/someId`)
      expect(getCalls .length).toEqual(2)
      expect(responseBody).toEqual(body)
    })
  })
});
