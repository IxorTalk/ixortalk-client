# IxorTalk Platform Client
A javascript client library to authenticate and communicate with the open-source IxorTalk platform!  

This library enables easy integration with minimal set-up.

## Getting Started
First, install the library in your javascript project using either **Yarn** or **NPM**:

    $ yarn add ixortalk-client
    $ npm install ixortalk-client
    
Secondly, initialize the client with some information it needs about your specific instance.
**These can be found in the configuration of your back-end.**

    import client from 'ixortalk-client'
    
    client.initialize({
        baseUrl: 'https://www.demo-ixortalk.com',
        clientId: 'ixortalkOAuthClient',
        clientSecret: 'ixortalkOAuthClientSecret',
        storageKey: 'IxorTalk',  // Optional; will use "IxorTalk Client" by default 
    })
    
Now you can log in your user!

    await client.logIn({email: 'demo@ixortalk.com', password: 'demo'})
    console.log(client.currentUser) // Will log your logged in user!
    
And do requests authenticated as that user

    const response = await client.fetch('/assets/1234')  
      
    if (response.ok)
        console.log('My asset: ', await response.json())
        
**For more information and examples, read through the rest of the documentation!**

**Examples can be found in the `Examples` directory.**  
[**Expo Snack Example**](https://snack.expo.io/@stinodes/ixortalk-client-example)

## API reference
#### client.initialize( Config ): void 
Initializes the client with the passed configuration containing your back-end's 
basic information.
This will instantiate internals needed for the library to work, as well kick-off 
async processes, like looking up past sessions.   

**Arguments:**  

  * `config: Config`:  
    * `baseUrl (required)`: The base-URL of your back-end (including the protocol).   
    **Example:** `baseUrl: 'https://test.ixortalk.com'`  
    * `clientId (required)`: The client-id for your back-end, which should be the same as the one specified in your back-end's config.
    **Example:** `clientId: 'my-client-id'`  
    * `clientSecret (required)`: The client-secret for your back-end, which should be the same as the one specified in your back-end's config.
    **Example:** `clientSecret: 'my-client-secret'`
    * `storageKey (optional)`: The key the library uses to persist data.
    **Example:** `storageKey: 'myStorageKey'`

**Returns:**  

  * `undefined`
  
#### client.destroy(): void
Destroys the client again, removing configuration, listeners and state.

**Returns:**  

  * `undefined`
  
#### client.logIn( LogInOpts ): Promise<User>
Logs the user in. It fetches a token and persists it, fetches their data and 
persists/returns it.

**Parameters:**

  * `opts: LogInOpts (required)`:
    * `email: string (required)`: The user's e-mail address.
    * `password: string (required)`: The user's password.
    
**Returns:**

  * `Promise<User>`: A promise that resolves in the current user.
  
#### client.logOut(): Promise<void>
Deletes the user's data and tokens and revokes them in the back-end.

**Returns:**

  * `Promise<void>`: A promise that resolves when the logout is successful. 
    
#### client.register( RegisterOpts ): Promise<void>
Creates an account for a user. It does not return anything since the user does not 
yet exist at this point. The user will be notified by mail.

**Parameters:**

  * `opts: RegisterOpts (required)`: 
    * `email: string (required)`: The user's e-mail address
    * `firstName: string (required)`: The user's first name
    * `lastName: string (required)`: The user's last name
    * `langKey: string (required)`: The language key of the user's locale

 **Returns:**
   * `Promise<void>`
   
#### client.confirmPassword( ConfirmPWOpts ): Promise<void>
Confirms the user's account in the back-end. The passed key is passed to 
the web- or native app as a URL-parameter.  
This is used both for a user's initial password and password resets afterwards.

**Paramters:**

  * `opts: ConfirmPWOpts (required)`:
    * `key: string (required)`: The key passed in the URL of the confirm-page included in 
    the e-mail.
    * `password: string (required):`: The user's new password.

**Returns:**

  * `Promise<void>`
  
#### client.resetPassword( ResetPWOpts ): Promise<void>
Requests a password reset from the back-end. The user will receive an e-mail with 
a link to confirm their reset.

**Parameters:**

  * `opts: ResetPWOpts (required)`:
    * `email: string (required)`: The e-mail address of the user that wants to reset 
    their password.
    
**Returns:**

  * `Promise<void>`
  
#### client.onAuthChange( Callback, ?HandlerAddOpts ): Subscription
Passes a callback that gets called on authentication state changes 
(A.K.A. when a user logs in or out).  
Optionally you can request it to notify you of the current state as well.
It returns a subscription, which allows you to unsubscribe to events easily.

**Parameters:**

  * `callback: (?User) => any (required)`: A callback-function that takes the current auth state as 
  a user or null as argument.
  * `opts: HandlerAddOpts (optional)`:
    * `emitCurrent: boolean (optional)`: When true, the callback gets fired with the initial
    auth-state.
    
**Returns:**

  * `subscription: Subscription`:
    * `remove: () => void`: When called, detaches your handler so it does not get called anymore.
    
#### client.fetch( endpoint, ?FetchOpts ): Promise<Response>
Does a fetch call. It is modeled to be as similar as possible to the official `fetch`-api.  
If logged in, the user's access-token is injected in the headers, overriding the `Authorization`
-header.

If the request is not OK (A.K.A. not in 200-range), the request will reject with a `FetchError`.

**Parameters:**  

  * `endpoint: string (required)`: The endpoint of the platform you are trying to reach.
  Needs a starting forward-slash and will always be relative to the base-URL of the platform.
  * `opts: FetchOpts (optional)`: Options you'd usually pass to the standard fetch-API.
  Some common parameters:
    * `headers: ?Headers`: Either a `Headers`-instance or object-literal containing the 
    headers for your request. The `Authorization`-header will be overridden by the user's token.
    * `body: ?Object|FormData|Blob|...`: The standard body-types (**plus object literals**).
    If the body is an object literal, traditionally not supported by the `fetch`-API, it will 
    be converted to a JSON-string and the `application/json`-header will be added.
    * `method: ?MethodEnum`: The request's method. Common are: GET, POST, PUT, DELETE and PATCH.

**Returns:**  

  * `Promise<Response>`: A promise that resolves in the standard `Response`-object.
  
**Throws:**  

  * `FetchError`: An error containing some info about your request.
    * `status`: The requests (failed) status-code
    * `statusText`: Text corresponding with the status-code
    * `message`: The response's `response.text()` result.
    
Different method calls can be shorthanded using the `.get`, `.post`, `.put`, `.delete` and 
`.patch` calls.
These take the same arguments as the standard fetch-call, aside from the `method`-option.


## Troubleshooting

  * **Fetch rejects, saying `URLSearchParams` does not exist. What do?**  
  This has to do with `URLSearchParams` not being supported on the platform 
  your code runs on (e.g. [React Native](react-native-url-search-params-issue)).  
  To fix this, include a [polyfill](url-search-params-polyfill), and add it to the global object:  

  
    import URLSearchParams from 'url-search-params'  
      
    global.URLSearchParams = URLSearchParams


[react-native-url-search-params-issue]: https://github.com/facebook/react-native/issues/9596
[url-search-params-polyfill]: https://github.com/WebReflection/url-search-params
