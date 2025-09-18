const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
require('dotenv').config();

exports.register = async (req, res, next) => {
  try {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { fullName, email, phoneNumber, address, password, role = 'user' } = req.body;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // 3. Create user (password will be hashed by model hooks)
    const user = await User.create({
      full_name: fullName,
      email,
      phone_number: phoneNumber,
      address,
      password, // Model hooks will hash this
      role
    });

    // 5. Generate JWT token
    const token = generateToken(user);

    // 6. Remove sensitive data from response
    const userResponse = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      address: user.address,
      role: user.role,
      created_at: user.created_at
    };

    res.status(201).json({ 
      success: true, 
      data: userResponse,
      token 
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // 2. Find user with password field included
    const user = await User.scope('withPassword').findOne({ 
      where: { email } 
    });

    // 3. Check if user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user);

    // 5. Remove sensitive data from response
    const userResponse = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      address: user.address,
      role: user.role,
      created_at: user.created_at
    };

    // 6. Set cookie (optional)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'strict'
    });

    res.status(200).json({ 
      success: true, 
      data: userResponse,
      token 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};