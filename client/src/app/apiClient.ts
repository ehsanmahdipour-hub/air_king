import { authorizedRequest } from './auth/authApi';

/**
 * Authenticated JSON request helper shared by feature API modules. Delegates to
 * the auth layer so expired access tokens are refreshed and retried once before
 * failing, rather than surfacing a raw token error.
 */
export const apiRequest = authorizedRequest;