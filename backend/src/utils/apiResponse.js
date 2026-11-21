/**
 * Standard API Response Structure
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined && data !== null) {
      this.data = data;
    }
  }

  static success(res, statusCode = 200, data = null, message = 'Success') {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }

  static error(res, statusCode = 500, message = 'Something went wrong', errors = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
    });
  }
}

module.exports = ApiResponse;
