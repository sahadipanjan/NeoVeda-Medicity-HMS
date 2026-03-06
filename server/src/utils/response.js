/**
 * Standard API Response Helpers
 * 
 * Ensures consistent response formatting across all endpoints.
 */

/**
 * Success response
 * @param {import('express').Response} res 
 * @param {*} data - Payload
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status (default 200)
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Error response
 * @param {import('express').Response} res 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status (default 500)
 * @param {*} errors - Detailed errors (validation, etc.)
 */
function errorResponse(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const body = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
    };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
}

/**
 * Paginated response
 * @param {import('express').Response} res 
 * @param {Array} data - Results
 * @param {number} total - Total record count
 * @param {number} page - Current page
 * @param {number} limit - Page size
 */
function paginatedResponse(res, data, total, page, limit) {
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
        timestamp: new Date().toISOString(),
    });
}

module.exports = { successResponse, errorResponse, paginatedResponse };
