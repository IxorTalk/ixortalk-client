// @flow
import "whatwg-fetch";
import fetchMock from "fetch-mock";
import client from "../index";
import type { Config } from "../config";
import { basicAuth, FetchError } from "../utils";
import { createToken } from "../createToken";
import { storage } from "../Storage";

fetchMock.config = Object.assign(fetchMock.config, {
  Headers,
  Request,
  Response
});
describe("client", () => {
  const config: Config = {
    baseUrl: "https://test.ixortalk.com",
    clientId: "jest",
    clientSecret: "jestSecret"
  };
  const endpoint = (endpoint: string) => `${config.baseUrl}${endpoint}`;
  const mockResponseToken = {
    access_token: "accesstoken",
    refresh_token: "refreshtoken",
    expires_in: 123
  };
  const mockUser = {
    username: "admin@ixortalk.com",
    firstName: "Admin",
    lastName: "Admin",
    langKey: "en"
  };

  const mockLogin = () => {
    fetchMock.post(`${config.baseUrl}/uaa/oauth/token`, mockResponseToken);
    fetchMock.get(`${config.baseUrl}/uaa/user`, mockUser);
  };
  const loginAndMockLogin = async () => {
    mockLogin();
    await client.logIn({ email: "admin@ixortalk.com", password: "admin" });
  };

  describe("initialization", () => {
    beforeEach(() => {
      client.destroy();
    });
    test("Throws errors when not initialized", () => {
      expect(() =>
        client.logIn({ email: "admin@ixortalk.com", password: "admin" })
      ).toThrow(Error);
    });
    test("Gets initialized", () => {
      client.initialize(config);
      expect(client.isInitialized).toEqual(true);
    });
    test("Throws an error if required config is faulty", () => {
      expect(
        //$FlowFixMe this is on purpose!
        () => client.initialize({ ...config, baseUrl: 123 })
      ).toThrow(TypeError);
      expect(
        //$FlowFixMe this is on purpose!
        () => client.initialize({ ...config, clientId: 123 })
      ).toThrow(TypeError);
      expect(
        //$FlowFixMe this is on purpose!
        () => client.initialize({ ...config, clientSecret: 123 })
      ).toThrow(TypeError);
    });
  });

  const reinitialize = async () => {
    fetchMock.restore();
    localStorage.clear();
    client.destroy();
    client.initialize(config);
  };

  describe("logging in", () => {
    beforeEach(reinitialize);

    test("logs in correctly", async () => {
      fetchMock.post(endpoint(`/uaa/oauth/token`), mockResponseToken);
      fetchMock.get(endpoint(`/uaa/user`), mockUser);

      const user = await client.logIn({
        email: "admin@ixortalk.com",
        password: "admin"
      });

      const [tokenEndpoint, tokenOpts] = fetchMock.lastCall(
        endpoint(`/uaa/oauth/token`),
        "POST"
      );
      const body: FormData = tokenOpts.body;
      expect(body.get("username")).toEqual("admin@ixortalk.com");
      expect(body.get("password")).toEqual("admin");
      expect(body.get("grant_type")).toEqual("password");
      expect(tokenOpts.headers["Authorization"]).toEqual(
        basicAuth(config.clientId, config.clientSecret)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "IxorTalk Client",
        JSON.stringify({
          token: createToken(mockResponseToken),
          user: mockUser
        })
      );
      expect(user).toEqual(mockUser);

      const [userEndpoint, userOpts] = fetchMock.lastCall(
        endpoint(`/uaa/user`),
        "GET"
      );
      expect(userOpts.headers["Authorization"]).toEqual(
        `Bearer ${mockResponseToken.access_token}`
      );
    });
  });
  describe("logging out", () => {
    beforeEach(reinitialize);

    test("Throws an error when not logged in", async () => {
      let error;
      try {
        await client.logOut();
      } catch (e) {
        error = e;
      }
      expect(error).toEqual(new Error("You are not logged in at this time."));
    });

    test("logs out correctly", async () => {
      await loginAndMockLogin();
      fetchMock.get(endpoint(`/logout`), 200);

      await client.logOut();

      expect(localStorage.removeItem).toHaveBeenCalledWith("IxorTalk Client");
      expect(fetchMock.called(`${config.baseUrl}/logout`)).toEqual(true);
    });

    test("logs out even if back-end call fails", async () => {
      await loginAndMockLogin();
      fetchMock.get(endpoint(`/logout`), 401);

      let error;
      try {
        await client.logOut();
      } catch (e) {
        error = e;
      }
      expect(error).toBeFalsy();
      expect(client.currentUser).toBeNull();
    });
  });
  describe("Registering", () => {
    beforeEach(reinitialize);

    test("does the user registration call correctly", async () => {
      fetchMock.post(endpoint(`/user-registration`), 200);

      const user = {
        email: "admin@ixortalk.com",
        firstName: "admin",
        lastName: "admin",
        langKey: "en"
      };
      await client.register(user);

      const [_, opts] = fetchMock.lastCall(
        `${config.baseUrl}/user-registration`,
        "POST"
      );
      expect(opts.headers["Content-Type"]).toEqual("application/json");
      expect(JSON.parse(opts.body)).toEqual({
        username: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        langKey: user.langKey
      });
    });
  });

  describe("confirming password", () => {
    beforeEach(reinitialize);

    test("successfully set the password", async () => {
      fetchMock.post(endpoint(`/uaa/api/account/reset_password/finish`), 200);

      await client.confirmPassword({
        key: "123-this-is-a-key",
        password: "admin"
      });

      const [_, opts] = fetchMock.lastCall(
        endpoint(`/uaa/api/account/reset_password/finish`),
        "POST"
      );

      expect(opts.headers["Content-Type"]).toEqual("application/json");
      expect(JSON.parse(opts.body)).toEqual({
        key: "123-this-is-a-key",
        newPassword: "admin"
      });
    });
  });
  describe("reset password", () => {
    beforeEach(reinitialize);

    test("successfully request a reset", async () => {
      fetchMock.post(endpoint(`/uaa/api/account/reset_password/init`), 200);

      await client.resetPassword({ email: "admin@ixortalk.com" });

      const [_, opts] = fetchMock.lastCall(
        endpoint(`/uaa/api/account/reset_password/init`),
        "POST"
      );
      expect(opts.body).toEqual("admin@ixortalk.com");
    });
  });

  describe("currentUser", () => {
    beforeEach(reinitialize);

    test("contains null when there is no logged in user", async () => {
      expect(client.currentUser).toEqual(null);
    });
    test("contains the current user when logged in", async () => {
      await loginAndMockLogin();
      expect(client.currentUser).toEqual(mockUser);
    });
  });

  describe("onAuthChange", () => {
    beforeEach(reinitialize);

    test("Correctly fires callbacks when a log-in occurs", async () => {
      const handler = jest.fn();

      client.onAuthChange(handler);

      await loginAndMockLogin();

      expect(fetchMock.called(endpoint(`/uaa/oauth/token`))).toEqual(true);
      expect(handler.mock.calls[0]).toEqual([mockUser]);
    });
    test("Calls callback with the current state when option is passed", async () => {
      await loginAndMockLogin();
      fetchMock.get(endpoint(`/logout`), 200);
      const handler = jest.fn();

      client.onAuthChange(handler, { emitCurrent: true });

      expect(handler.mock.calls[0]).toEqual([mockUser]);

      await client.logOut();

      expect(handler.mock.calls[1]).toEqual([null]);
    });
    test("Correctly fires callbacks when a log-out occurs", async () => {
      await loginAndMockLogin();
      fetchMock.get(endpoint(`/logout`), 200);

      const handler = jest.fn();

      await client.logIn({ email: "admin@ixortalk.com", password: "admin" });
      client.onAuthChange(handler);
      await client.logOut();

      expect(fetchMock.called(endpoint(`/logout`))).toEqual(true);
      expect(handler.mock.calls[0]).toEqual([null]);
    });
    test("Fires callback when user jumps from undefined to null", async () => {
      storage.getItem = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        // $FlowFixMe
        return null;
      });
      const cb = jest.fn();

      client.onAuthChange(cb, { emitCurrent: true });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(cb.mock.calls.length).toEqual(1);
    });
    test("Fires callback with an error when the client is destroyed", async () => {
      const cb = jest.fn();
      client.onAuthChange(cb);
      client.destroy();
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual(null);
      expect(cb.mock.calls[0][1]).toBeInstanceOf(Error);
    });
  });

  describe("fetch", () => {
    beforeEach(reinitialize);

    test('Fetches from an endpoint of the configurated platform and returns a "Response" object.', async () => {
      const body = { someProperty: "someValue" };
      fetchMock.get(endpoint(`/my-resource`), body);

      const result = await client.fetch("/my-resource");
      const resultBody = await result.json();

      expect(fetchMock.called(endpoint(`/my-resource`))).toEqual(true);
      expect(result).toBeInstanceOf(Response);
      expect(result.ok).toEqual(true);
      expect(result.status).toEqual(200);
      expect(result.statusText).toEqual("OK");
      expect(resultBody).toEqual(body);
    });

    test('Does a "POST"-request with body', async () => {
      const body = { someProperty: "someValue" };
      fetchMock.post(endpoint(`/my-resource`), 200);

      const result = await client.fetch("/my-resource", {
        method: "POST",
        body
      });

      const [_, opts] = fetchMock.lastCall(endpoint(`/my-resource`), "POST");

      expect(fetchMock.called(`${config.baseUrl}/my-resource`)).toEqual(true);
      expect(opts.body).toEqual('{"someProperty":"someValue"}');
      expect(result).toBeInstanceOf(Response);
      expect(result.ok).toEqual(true);
      expect(result.status).toEqual(200);
    });
    test('Does a "POST"-request with empty object body', async () => {
      const body = {};
      fetchMock.post(endpoint(`/my-resource`), 200);

      const result = await client.fetch("/my-resource", {
        method: "POST",
        body
      });

      const [_, opts] = fetchMock.lastCall(endpoint(`/my-resource`), "POST");

      expect(fetchMock.called(endpoint(`/my-resource`))).toEqual(true);
      expect(opts.body).toEqual("{}");
      expect(result).toBeInstanceOf(Response);
      expect(result.ok).toEqual(true);
      expect(result.status).toEqual(200);
    });

    test("Injects the token if someone is logged in.", async () => {
      await loginAndMockLogin();
      const body = { someProperty: "someValue" };
      fetchMock.get(endpoint(`/my-auth-resource`), body);

      const result = await client.fetch("/my-auth-resource");
      const resultBody = await result.json();

      const [_, opts] = fetchMock.lastCall(endpoint(`/my-auth-resource`));
      expect(opts.headers["Authorization"]).toEqual(
        `Bearer ${createToken(mockResponseToken).accessToken}`
      );
      expect(resultBody).toEqual(body);
    });

    test('Returns a "FetchError" on failed requests', async () => {
      fetchMock.get(endpoint(`/my-404-resource`), 404);
      let error;
      try {
        await client.fetch("/my-404-resource");
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
      expect(error.name).toEqual("Fetch Error: 404");
    });
  });

  describe("Fetch shorthands", () => {
    beforeEach(reinitialize);

    describe("get", () => {
      test('does a request with method "GET"', async () => {
        const body = { myProperty: "myValue" };
        fetchMock.get(endpoint(`/objects/someId`), body);

        const result = await client.get("/objects/someId");
        const resultBody = await result.json();

        const [_, opts] = fetchMock.lastCall(endpoint(`/objects/someId`));
        expect(opts.method).toEqual("GET");
        expect(resultBody).toEqual(body);
      });
    });
    describe("post", () => {
      test('does a request with method "POST".', async () => {
        fetchMock.post(endpoint(`/objects`), 201);

        const result = await client.post("/objects");

        const [_, opts] = fetchMock.lastCall(endpoint(`/objects`));
        expect(opts.method).toEqual("POST");
        expect(result.status).toEqual(201);
      });
    });
    describe("put", () => {
      test('does a request with method "PUT"', async () => {
        const object = { myProperty: "myEditedValue" };
        fetchMock.put(endpoint(`/objects/someId`), object);

        const result = await client.put("/objects/someId", { body: object });
        const resultBody = await result.json();

        const [_, opts] = fetchMock.lastCall(endpoint(`/objects/someId`));
        expect(opts.method).toEqual("PUT");
        expect(resultBody).toEqual(object);
      });
    });
    describe("delete", () => {
      test('does a request with method "DELETE"', async () => {
        fetchMock.delete(endpoint(`/objects/someId`), 204);

        const result = await client.delete("/objects/someId");

        const [_, opts] = fetchMock.lastCall(endpoint(`/objects/someId`));
        expect(opts.method).toEqual("DELETE");
        expect(result.status).toEqual(204);
      });
    });
    describe("patch", () => {
      test('does a request with method "PATCH"', async () => {
        const object = { someProperty: "somePatchedValue" };
        fetchMock.patch(endpoint(`/objects/someId`), object);

        const result = await client.patch("/objects/someId");
        const resultBody = await result.json();

        const [_, opts] = fetchMock.lastCall(endpoint(`/objects/someId`));
        expect(opts.method).toEqual("PATCH");
        expect(resultBody).toEqual(object);
      });
    });
  });
  describe("tokens", () => {
    beforeEach(reinitialize);
    test('refresh and persist when a "401"-response is returned', async () => {
      const body = { test: "test" };
      await loginAndMockLogin();
      fetchMock.get(
        endpoint(`/objects/someId`),
        { status: 401, body: null },
        { repeat: 1 }
      );
      fetchMock.get(endpoint(`/objects/someId`), body, {
        overwriteRoutes: false
      });

      const response = await client.get("/objects/someId");
      const responseBody = await response.json();

      const getCalls = fetchMock.calls(`${config.baseUrl}/objects/someId`);
      expect(getCalls.length).toEqual(2);
      expect(responseBody).toEqual(body);
    });
    test('does not refresh and persist when a "403"-response is returned', async () => {
      const body = { test: "test" };
      await loginAndMockLogin();
      fetchMock.get(
        endpoint(`/objects/someId`),
        { status: 403, body: null },
        { repeat: 1 }
      );
      fetchMock.get(endpoint(`/objects/someId`), body, {
        overwriteRoutes: false
      });

      let error;
      try {
        const response = await client.get("/objects/someId");
      } catch (e) {
        error = e;
      }

      const getCalls = fetchMock.calls(`${config.baseUrl}/objects/someId`);
      expect(getCalls.length).toEqual(1);
      expect(error).toBeInstanceOf(Error);
      expect(error && error.status).toEqual(403);
    });
  });
});
