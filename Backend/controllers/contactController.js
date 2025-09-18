const { Contact, User, Notification } = require('../models');
const socketService = require('../services/socketService');

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Check if user exists with this email
    const user = await User.findOne({ where: { email } });

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      user_id: user ? user.id : null
    });

    // Send notification to user if they have an account
    if (user) {
      const notification = await Notification.create({
        user_id: user.id,
        title: 'Message sent successfully',
        message: `Your message "${subject}" has been sent to our team. We'll get back to you soon!`,
        type: 'contact_sent'
      });
      
      socketService.sendNotification(user.id, {
        id: notification.id,
        type: 'contact_sent',
        title: 'Message sent successfully',
        message: `Your message "${subject}" has been sent to our team. We'll get back to you soon!`,
        created_at: notification.created_at
      });
    }

    // Send notification to all admins
    const admins = await User.findAll({ where: { role: 'admin' } });
    for (const admin of admins) {
      const notification = await Notification.create({
        user_id: admin.id,
        title: 'New contact message received',
        message: `New message from ${name}: "${subject}"`,
        type: 'contact_received'
      });
      
      socketService.sendNotification(admin.id, {
        id: notification.id,
        type: 'contact_received',
        title: 'New contact message received',
        message: `New message from ${name}: "${subject}"`,
        created_at: notification.created_at
      });
      
      // Send new contact message data
      socketService.sendNewContactMessage(admin.id, contact);
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: contact
    });
  } catch (err) {
    console.error('submitContact error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};