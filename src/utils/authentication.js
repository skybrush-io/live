/**
 * Extracts a JWT authentication token from the current URL if the URL includes
 * a token. Returns undefined otherwise.
 */
export function getAuthenticationTokenFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams ? url.searchParams.get('token') : undefined;
}
