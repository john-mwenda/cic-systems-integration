export const HttpStatus = {
  OK: { code: 200, status: 'OK' },
  CREATED: { code: 201, status: 'CREATED' },
  NO_CONTENT: { code: 204, status: 'NO_CONTENT' },
  BAD_REQUEST: { code: 400, status: 'BAD_REQUEST' },
  NOT_FOUND: { code: 404, status: 'NOT_FOUND' },
  FORBIDDEN: { code: 403, status: 'FORBIDDEN' },
  UNAUTHORIZED: { code: 401, status: 'UNAUTHORIZED' },
  TOO_MANY_REQUESTS: { code: 429, status: 'TOO_MANY_REQUESTS' },
  INTERNAL_SERVER_ERROR: { code: 500, status: 'INTERNAL_SERVER_ERROR' }
};
