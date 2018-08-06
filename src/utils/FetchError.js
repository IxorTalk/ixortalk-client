// @flow
export class FetchError extends Error {
  // response: Response
  status: number;
  statusText: string;
  body: ?string;

  constructor(response: Response, textBody: ?string) {
    super(
      `"${response.status} - ${response.statusText}" on request to "${
        response.url
      }".`,
    );
    this.name = `Fetch Error: ${response.status}`;
    this.status = response.status;
    this.statusText = response.statusText;
    this.body = textBody;
  }
}
