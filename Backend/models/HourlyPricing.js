const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Court = require('./Court');

const Pricing = sequelize.define('Pricing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  court_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courts',
      key: 'id'
    }
  },
  hour: {
    type: DataTypes.STRING, // e.g., "09:00 - 10:00"
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'general' // '5v5', '7v7', or 'general'
  }
}, {
  tableName: 'pricings',
  timestamps: false
});

Pricing.belongsTo(Court, { foreignKey: 'court_id' });
Court.hasMany(Pricing, { foreignKey: 'court_id' });

module.exports = Pricing;
