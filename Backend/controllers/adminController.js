const { User, Court, Booking, Contact, Notification } = require('../models');
const Pricing = require('../models/HourlyPricing');
const sequelize = require('../config/db');
const socketService = require('../services/socketService');

// Get all users (excluding admins)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: ['customer', 'court_manager', 'player']
      },
      attributes: ['id', 'full_name', 'email', 'phone_number', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete admin users'
      });
    }

    // Delete user dependencies in order
    await Notification.destroy({ where: { user_id: id }, transaction });
    await Contact.destroy({ where: { user_id: id }, transaction });
    await Booking.destroy({ where: { user_id: id }, transaction });
    
    // If court manager, delete court and its pricing
    if (user.role === 'court_manager') {
      const courts = await Court.findAll({ where: { court_manager_id: id } });
      for (const court of courts) {
        await Pricing.destroy({ where: { court_id: court.id }, transaction });
        await Booking.destroy({ where: { court_id: court.id }, transaction });
      }
      await Court.destroy({ where: { court_manager_id: id }, transaction });
    }
    
    await user.destroy({ transaction });
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    await transaction.rollback();
    console.error('deleteUser error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete court
exports.deleteCourt = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({
        success: false,
        error: 'Court not found'
      });
    }

    // Delete court dependencies
    await Pricing.destroy({ where: { court_id: id }, transaction });
    await Booking.destroy({ where: { court_id: id }, transaction });
    await court.destroy({ transaction });
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Court deleted successfully'
    });
  } catch (err) {
    await transaction.rollback();
    console.error('deleteCourt error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all contact messages
exports.getContactMessages = async (req, res) => {
  try {
    const messages = await Contact.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('getContactMessages error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Reply to contact message
exports.replyToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found'
      });
    }

    // Update contact with reply
    await contact.update({
      replied: true,
      reply_message: reply
    });

    // Send notification to user if they have an account
    if (contact.user_id) {
      const notification = await Notification.create({
        user_id: contact.user_id,
        title: 'From Admin',
        message: `Thank you for contacting Us. ${reply}`,
        type: 'contact_reply'
      });
      
      socketService.sendNotification(contact.user_id, {
        id: notification.id,
        type: 'contact_reply',
        title: 'From Admin',
        message: `Thank you for contacting Us. ${reply}`,
        created_at: notification.created_at
      });
    }

    res.json({
      success: true,
      message: 'Reply sent successfully'
    });
  } catch (err) {
    console.error('replyToContact error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};