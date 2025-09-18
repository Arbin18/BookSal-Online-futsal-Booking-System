const User = require('./User');
const Court = require('./Court');
const Pricing = require('./HourlyPricing');
const Booking = require('./Booking');
const Notification = require('./Notification');
const Contact = require('./Contact');
const Rating = require('./Rating');

// Define associations
// Note: Pricing associations are already defined in HourlyPricing.js

// Court-User associations (one-to-one: one court manager has one court)
Court.belongsTo(User, { foreignKey: 'court_manager_id' });
User.hasOne(Court, { foreignKey: 'court_manager_id' });

// Booking associations
Booking.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Booking, { foreignKey: 'user_id' });

Booking.belongsTo(Court, { foreignKey: 'court_id' });
Court.hasMany(Booking, { foreignKey: 'court_id' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

Notification.belongsTo(Booking, { foreignKey: 'booking_id' });
Booking.hasMany(Notification, { foreignKey: 'booking_id' });

// Contact associations
Contact.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Contact, { foreignKey: 'user_id' });

// Rating associations
Rating.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Rating, { foreignKey: 'user_id' });

Rating.belongsTo(Court, { foreignKey: 'court_id' });
Court.hasMany(Rating, { foreignKey: 'court_id' });

module.exports = {
  User,
  Court,
  Pricing,
  Booking,
  Notification,
  Contact,
  Rating
}; 