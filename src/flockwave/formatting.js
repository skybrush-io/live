import { escape, isString, trimEnd } from 'lodash';

/**
 * Formats a Flockwave command response object found in a CMD-RESP message
 * into HTML.
 *
 * @param  {string|Object}  response  the response object in a CMD-RESP
 *         message; either a string (to be interpreted as plain text) or
 *         an object with keys `type` and `data`.````
 * @return {string} the formatted response with HTML markup
 */
export function formatCommandResponseAsHTML(response) {
  if (isString(response)) {
    return formatCommandResponseAsHTML({ type: 'plain', data: response });
  }

  const { type, data } = response;

  switch (type) {
    case 'plain':
      return '<pre>' + escape(trimEnd(data)) + '</pre>';

    default:
      return '<pre>' + escape(JSON.stringify(response, null, 2)) + '</pre>';
  }
}
