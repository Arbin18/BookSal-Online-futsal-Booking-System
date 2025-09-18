const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpire = process.env.JWT_EXPIRE;
const jwtCookieExpire = process.env.JWT_COOKIE_EXPIRE || 7;

module.exports = {
  jwtSecret,
  jwtExpire,
  jwtCookieExpire,
  
  generateToken: (user) => {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: jwtExpire }
    );
  },

  verifyToken: (token) => {
    return jwt.verify(token, jwtSecret);
  },

  cookieOptions: {
    expires: new Date(
      Date.now() + jwtCookieExpire * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
};