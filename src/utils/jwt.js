const jwt = require('jsonwebtoken');

/**
 * Generate JWT token with user ID and email
 * @param {String} userId - User ID
 * @param {String} email - User email (optional)
 * @returns {String} JWT token
 */
const generateToken = (userId, email = null) => {
  const payload = { id: userId };
  
  if (email) {
    payload.email = email;
  }
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};

