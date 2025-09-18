const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Court = sequelize.define('Court', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  map_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
  },
  capacity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 3.0,
    validate: {
      min: 1,
      max: 5
    }
  },
  opening_hours: {
    type: DataTypes.STRING,
    defaultValue: '6:00 AM - 9:00 PM'
  },
  description: {
    type: DataTypes.TEXT
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  google_maps_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  court_manager_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    unique: true  // ⛔ Only one court per court_manager
  },

}, {
  tableName: 'courts',
  timestamps: false
});

// Association will be defined in index.js to avoid duplicates

module.exports = Court;
