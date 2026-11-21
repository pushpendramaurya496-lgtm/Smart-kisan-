const { verifyToken } = require('../../services/jwt.service');
const User = require('./auth.model');
const ApiResponse = require('../../utils/apiResponse');

/**
 * Authentication Protection Middleware
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 401, 'अनधिकृत: कृपया पहले लॉगिन करें (Token Missing)');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return ApiResponse.error(res, 401, 'टोकन अमान्य या समाप्त हो चुका है। कृपया पुनः लॉगिन करें');
  }

  try {
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return ApiResponse.error(res, 401, 'उपयोगकर्ता खाता निष्क्रिय या अमान्य है');
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 500, 'प्रमाणीकरण त्रुटि', error.message);
  }
};

module.exports = {
  protect,
};
