import escape from 'lodash-es/escape';
import isString from 'lodash-es/isString';
import trimEnd from 'lodash-es/trimEnd';

/**
 * Formats a Flockwave command response object found in an OBJ-CMD message
 * or its asynchronous response variant in ASYNC-RESP into HTML.
 *
 * @param  {string|Object}  response  the response object in an OBJ-CMD or
 *         ASYNC-RESP message; either a string (to be interpreted as plain text)
 *         or an object with keys `type` and `data`.````
 * @return {string} the formatted response with HTML markup
 */
export function formatCommandResponseAsHTML(response) {
  if (isString(response)) {
    response = {
      type: 'plain',
      data: response,
    };
  }

  const { type, data } = response;

  switch (type) {
    case 'plain':
      return escape(trimEnd(data));

    case 'preformatted':
      return '<pre>' + escape(trimEnd(data)) + '</pre>';

    default:
      return escape(JSON.stringify(response, null, 2));
  }
}
