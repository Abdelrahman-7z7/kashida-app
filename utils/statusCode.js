const SUCCESS = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const CONFLICT = 409;
const INTERNAL_SERVER_ERROR = 500;
const SERVICE_UNAVAILABLE = 503;

module.exports = {
    SUCCESS,
    CREATED,
    NO_CONTENT,
    BAD_REQUEST,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    INTERNAL_SERVER_ERROR,
    SERVICE_UNAVAILABLE
};

// 200: OK
// 201: Created
// 204: No Content
// 400: Bad Request
// 401: Unauthorized
// 403: Forbidden
// 404: Not Found
// 409: Conflict
// 422: Unprocessable Entity
// 500: Internal Server Error
// 503: Service Unavailable