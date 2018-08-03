## OAuth2 Flow

### Login

To log in using oauth2, the app does a `POST`-request to 
`{base-url}/uaa/oauth/token`, with the following parameters:
  
* Url: `{base-url}/uaa/oauth/token`  
* Method: `POST`  
* Headers: 
    * `Authorization: basicAuth('clientId', 'clientSecret')`
* Body (form-data):
    * `username: {username}`  
    * `password: {password}`  
    * `grant_type: password`  
    
This is expected to return a token-object containing the following
properties (rest are ignored for now): 

* `access_token: string`  
* `refresh_token: string`
* `expires_in: number`

This token is parsed and persisted on the user's device, and loaded
back in whenever the session should be resumed.

### Normal Requests

When the app does a request and a token is preset, it will add it 
to the headers of said request as `Authorization: Bearer {token.access_token}`, 
but only after checking if the token is still valid.  

This is done, firstly, by comparing the current time with the one calculated from `expires_in`, which was
returned from the original call to `/uaa/oauth/token`.  

If the token is indeed expired, a new one will be fetched using the refresh-token.

Similarly, if the request gets sent and returns a `401`, of which the message includes `invalid_token`, 
the token will be refreshed.

### Refreshing the Token

Refreshing a token is similar to logging in initially.
The request is done as follows:  

* Url: `{base-url}/uaa/oauth/token`  
* Method: `POST`  
* Headers: 
    * `Authorization: basicAuth('clientId', 'clientSecret')`
* Body (form-data):
    * `refresh_token: {token.refresh_token}`  
    * `grant_type: refresh_token`
    
This returns a token object with the same shape as returned from logging in.  