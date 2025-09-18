const { Booking, Court, User, Notification } = require('../models');
const Pricing = require('../models/HourlyPricing');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const socketService = require('../services/socketService');

// Helper function to create notifications
const createNotification = async (userId, type, title, message, bookingId = null, opponentName = null) => {
  try {
    console.log('Creating notification:', { userId, type, title, message, bookingId, opponentName });
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      booking_id: bookingId,
      opponent_name: opponentName
    });
    console.log('Notification created successfully:', notification.id);
    
    // Send real-time notification
    const socketService = require('../services/socketService');
    socketService.sendNotification(userId, {
      id: notification.id,
      type,
      title,
      message,
      booking_id: bookingId,
      opponent_name: opponentName,
      created_at: notification.created_at
    });
    
    return notification;
  } catch (error) {
    console.error('createNotification error:', error);
    throw error;
  }
};

// Helper function to convert 12-hour format to 24-hour format
const convertTo24Hour = (time12h) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}:00`;
};

// Helper function to convert 24-hour format to 12-hour format
const convertTo12Hour = (time24h) => {
  const [hours, minutes] = time24h.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Cleanup function to remove bookings without payment methods after 8 minutes (except finding_team)
const cleanupIncompleteBookings = async () => {
  try {
    const result = await Booking.destroy({
      where: {
        payment_method: { [Op.is]: null },
        status: { [Op.ne]: 'finding_team' },
        created_at: {
          [Op.lt]: new Date(Date.now() - 8 * 60 * 1000)
        }
      }
    });
    if (result > 0) {
      console.log(`Cleaned up ${result} incomplete bookings`);
    }
  } catch (error) {
    console.error('Error cleaning up incomplete bookings:', error);
  }
};

// Run cleanup every 2 minutes
setInterval(cleanupIncompleteBookings, 2 * 60 * 1000);

// Create a new booking
exports.createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      court_id,
      booking_date,
      time_slot,
      duration,
      name,
      email,
      phone,
      team_size,
      matchmaking
    } = req.body;

    // Convert time slot to start and end times
    const [startTimeStr, endTimeStr] = time_slot.split(' - ');
    const start_time = convertTo24Hour(startTimeStr);
    const end_time = convertTo24Hour(endTimeStr);

    // Validate required fields
    if (!court_id || !booking_date || !time_slot || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: court_id, booking_date, time_slot, name, email, phone'
      });
    }

    // Check if court exists and get pricing
    const court = await Court.findByPk(court_id, {
      include: [{
        model: Pricing,
        where: {
          hour: time_slot,
          type: team_size === '7' ? '7v7' : '5v5'
        },
        required: false
      }]
    });
    
    if (!court) {
      return res.status(404).json({
        success: false,
        error: 'Court not found'
      });
    }
    
    // Get price for the time slot
    let price = 1000; // Default price
    if (court.Pricings && court.Pricings.length > 0) {
      price = parseFloat(court.Pricings[0].price);
    }

    // Check for booking conflicts (only consider confirmed bookings)
    const conflictingBooking = await Booking.findOne({
      where: {
        court_id,
        booking_date,
        start_time,
        end_time,
        court_type: team_size === '7' ? '7v7' : '5v5',
        status: {
          [Op.in]: ['confirmed', 'finding_team']
        }
      }
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        error: 'Time slot is already booked'
      });
    }

    // Create the booking without payment method (will be added later)
    const bookingData = {
      court_id,
      user_id: req.user.id,
      booking_date,
      start_time,
      end_time,
      court_type: team_size === '7' ? '7v7' : '5v5',
      total_price: price,
      team_name: name,
      contact_phone: phone,
      number_of_players: matchmaking ? (parseInt(team_size) || 5) : (team_size === '7' ? 14 : 10),
      status: matchmaking ? 'finding_team' : 'pending',
      is_matchmaking: matchmaking || false
    };
    
    const booking = await Booking.create(bookingData, { transaction });

    await transaction.commit();

    // Create notification for finding team booking
    if (matchmaking) {
      try {
        const timeSlot = `${convertTo12Hour(start_time)} - ${convertTo12Hour(end_time)}`;
        const bookingDate = new Date(booking_date).toLocaleDateString();
        
        await createNotification(
          req.user.id,
          'team_joined',
          'Looking for Opponents',
          `You are now looking for opponents for ${team_size === '7' ? '7v7' : '5v5'} match on ${bookingDate} at ${timeSlot}. Other teams can join your match. You will be notified when a team joins.`,
          booking.id
        );
      } catch (notificationError) {
        console.error('Failed to create finding team notification:', notificationError);
      }
    }

    // Emit real-time time slot update
    socketService.sendTimeSlotUpdate(court_id, {
      date: booking_date,
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      data: { id: booking.id, total_price: booking.total_price },
      message: 'Booking created successfully'
    });

  } catch (err) {
    await transaction.rollback();
    console.error('createBooking error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while creating the booking'
    });
  }
};

// Get all bookings for a user
exports.getUserBookings = async (req, res) => {
  // Check for expired bookings
  await exports.checkExpiredBookings();
  
  try {
    const bookings = await Booking.findAll({
      where: {
        user_id: req.user.id,
        [Op.or]: [
          { payment_method: { [Op.ne]: null } },
          { status: 'finding_team' }
        ]
      },
      include: [
        {
          model: Court,
          attributes: ['id', 'name', 'location', 'phone_number']
        }
      ],
      order: [['booking_date', 'DESC'], ['created_at', 'DESC']]
    });

    // For matchmaking bookings, find opponent teams
    const bookingsWithOpponents = await Promise.all(bookings.map(async (booking) => {
      const bookingData = booking.toJSON();
      
      if (booking.is_matchmaking && booking.status === 'confirmed') {
        // Find opponent booking for the same time slot
        const opponentBooking = await Booking.findOne({
          where: {
            court_id: booking.court_id,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            court_type: booking.court_type,
            is_matchmaking: true,
            status: 'confirmed',
            user_id: { [Op.ne]: req.user.id }
          },
          attributes: ['team_name']
        });
        
        if (opponentBooking) {
          bookingData.opponent_team = opponentBooking.team_name;
        }
      }
      
      return bookingData;
    }));

    res.json({
      success: true,
      data: bookingsWithOpponents
    });

  } catch (err) {
    console.error('getUserBookings error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while fetching bookings'
    });
  }
};

// Get all bookings for a court (for court managers)
exports.getCourtBookings = async (req, res) => {
  try {
    const { court_id } = req.params;
    const { date, status } = req.query;

    // Verify the court belongs to the authenticated user
    const court = await Court.findOne({
      where: {
        id: court_id,
        court_manager_id: req.user.id
      }
    });

    if (!court) {
      return res.status(404).json({
        success: false,
        error: 'Court not found or unauthorized'
      });
    }

    const whereClause = { 
      court_id,
      [Op.or]: [
        { payment_method: { [Op.ne]: null } },
        { status: 'finding_team' }
      ]
    };
    
    if (date) {
      whereClause.booking_date = date;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'full_name', 'email', 'phone_number']
        }
      ],
      order: [['booking_date', 'ASC'], ['start_time', 'ASC']]
    });

    res.json({
      success: true,
      data: bookings
    });

  } catch (err) {
    console.error('getCourtBookings error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while fetching court bookings'
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Court,
          attributes: ['id', 'name', 'location', 'phone_number']
        },
        {
          model: User,
          attributes: ['id', 'full_name', 'email', 'phone_number']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'court_manager') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (err) {
    console.error('getBookingById error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while fetching the booking'
    });
  }
};

// Update booking status (for court managers and admins)
exports.updateBookingStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, payment_method } = req.body;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Court,
          attributes: ['id', 'court_manager_id']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      req.user.role === 'admin' || 
      (req.user.role === 'court_manager' && booking.Court.court_manager_id === req.user.id) ||
      booking.user_id === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this booking'
      });
    }

    // Store original status before update
    const originalStatus = booking.status;
    
    // Update booking
    const updateData = { status };
    if (payment_method) {
      updateData.payment_method = payment_method;
    }

    await booking.update(updateData, { transaction });

    // If booking is confirmed, remove any pending bookings for the same time slot
    if (status === 'confirmed') {
      await Booking.destroy({
        where: {
          court_id: booking.court_id,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          court_type: booking.court_type,
          status: 'pending',
          payment_method: { [Op.is]: null },
          id: { [Op.ne]: booking.id }
        },
        transaction
      });
    }

    await transaction.commit();

    // Emit real-time time slot update when booking is confirmed
    if (status === 'confirmed' && originalStatus !== 'confirmed') {
      socketService.sendTimeSlotUpdate(booking.court_id, {
        date: booking.booking_date,
        updated_at: new Date()
      });
    }

    // Create booking confirmation notification when status becomes confirmed (outside transaction)
    if (status === 'confirmed' && originalStatus !== 'confirmed') {
      try {
        const timeSlot = `${convertTo12Hour(booking.start_time)} - ${convertTo12Hour(booking.end_time)}`;
        const bookingDate = new Date(booking.booking_date).toLocaleDateString();
        
        let notificationMessage;
        let notificationTitle;
        
        if (booking.is_matchmaking && status === 'confirmed' && originalStatus === 'finding_team') {
          notificationTitle = 'Finding Team';
          notificationMessage = `You are now looking for opponents for ${booking.court_type} match on ${bookingDate} at ${timeSlot}. Other teams can join your match. You will be notified when a team joins.`;
        } else if (booking.is_matchmaking) {
          notificationTitle = 'Finding Team';
          notificationMessage = `You are looking for opponents for ${booking.court_type} match on ${bookingDate} at ${timeSlot}. Other teams can now join your match.`;
        } else {
          notificationTitle = 'Booking Confirmed';
          if (payment_method === 'esewa') {
            notificationMessage = `Your ${booking.court_type} booking for ${bookingDate} at ${timeSlot} has been confirmed. Advanced paid: Rs. 50. Total amount: Rs. ${booking.total_price}.`;
          } else {
            notificationMessage = `Your ${booking.court_type} booking for ${bookingDate} at ${timeSlot} has been confirmed. Total amount: Rs. ${booking.total_price}.`;
          }
        }
        
        await createNotification(
          booking.user_id,
          'booking_confirmed',
          notificationTitle,
          notificationMessage,
          booking.id
        );
      } catch (notificationError) {
        console.error('Failed to create booking confirmation notification:', notificationError);
      }
    }
    
    // Create payment success notification if requested (outside transaction)
    if (req.body.create_payment_notification && status === 'confirmed') {
      try {
        const details = req.body.booking_details;
        let notificationMessage;
        
        if (payment_method === 'esewa') {
          notificationMessage = `Advance payment of Rs. 50 completed via eSewa for your ${details.team_size}v${details.team_size} booking at ${details.court_name} on ${new Date(details.booking_date).toLocaleDateString()} at ${details.time_slot}. Advanced paid: Rs. 50. Please pay remaining Rs. ${details.total_price - 50} at the futsal venue.`;
        } else if (payment_method === 'online') {
          notificationMessage = `Advance payment of Rs. 50 completed via Esewa for your ${details.team_size}v${details.team_size} booking at ${details.court_name} on ${new Date(details.booking_date).toLocaleDateString()} at ${details.time_slot}. Please pay remaining Rs. ${details.total_price - 50} at the futsal venue.`;
        } else {
          notificationMessage = `Your ${details.team_size}v${details.team_size} booking at ${details.court_name} on ${new Date(details.booking_date).toLocaleDateString()} at ${details.time_slot} is confirmed. Please pay full amount Rs. ${details.total_price} at the venue after playing.`;
        }
        
        await createNotification(
          req.user.id,
          'payment_success',
          payment_method === 'esewa' || payment_method === 'online' ? 'Advance Payment Successful!' : 'Booking Confirmed!',
          notificationMessage,
          booking.id
        );
      } catch (notificationError) {
        console.error('Failed to create payment success notification:', notificationError);
      }
    }

    // Fetch updated booking with details
    const updatedBooking = await Booking.findByPk(id, {
      include: [
        {
          model: Court,
          attributes: ['id', 'name', 'location', 'phone_number']
        },
        {
          model: User,
          attributes: ['id', 'full_name', 'email', 'phone_number']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking status updated successfully'
    });

  } catch (err) {
    await transaction.rollback();
    console.error('updateBookingStatus error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while updating the booking'
    });
  }
};

// Join matchmaking
exports.joinMatchmaking = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      court_id,
      booking_date,
      time_slot,
      team_size,
      name,
      email,
      phone
    } = req.body;

    // Convert time slot to start and end times
    const [startTimeStr, endTimeStr] = time_slot.split(' - ');
    const start_time = convertTo24Hour(startTimeStr);
    const end_time = convertTo24Hour(endTimeStr);

    // Find the finding_team booking
    const findingTeamBooking = await Booking.findOne({
      where: {
        court_id,
        booking_date,
        start_time,
        end_time,
        court_type: team_size === '7' ? '7v7' : '5v5',
        status: 'finding_team'
      }
    });

    if (!findingTeamBooking) {
      return res.status(404).json({
        success: false,
        error: 'No team looking for opponents at this time slot'
      });
    }
    
    // Get price for the time slot
    const pricing = await Pricing.findOne({
      where: {
        court_id,
        hour: time_slot,
        type: team_size === '7' ? '7v7' : '5v5'
      }
    });
    
    const price = pricing ? parseFloat(pricing.price) : 1000;

    // Create booking for the joining team
    const joiningBooking = await Booking.create({
      court_id,
      user_id: req.user.id,
      booking_date,
      start_time,
      end_time,
      court_type: team_size === '7' ? '7v7' : '5v5',
      total_price: price,
      team_name: name,
      contact_phone: phone,
      number_of_players: team_size === '7' ? 7 : 5,
      status: 'confirmed',
      payment_method: 'cash',
      is_matchmaking: true
    }, { transaction });

    // Update the original finding_team booking to mark as matchmaking
    await findingTeamBooking.update({
      status: 'confirmed',
      payment_method: 'cash',
      is_matchmaking: true
    }, { transaction });



    await transaction.commit();

    // Emit real-time time slot update
    socketService.sendTimeSlotUpdate(court_id, {
      date: booking_date,
      updated_at: new Date()
    });

    // Create notifications for both users with detailed messages
    const timeSlot = `${convertTo12Hour(start_time)} - ${convertTo12Hour(end_time)}`;
    const bookingDate = new Date(booking_date).toLocaleDateString();
    
    try {
      await createNotification(
        findingTeamBooking.user_id,
        'team_joined',
        'Team Found!',
        `Great news! Team "${name}" joined your ${team_size === '7' ? '7v7' : '5v5'} match on ${bookingDate} at ${timeSlot}. Please pay at the venue after playing.`,
        findingTeamBooking.id,
        name
      );
      
      await createNotification(
        req.user.id,
        'team_joined',
        'Match Joined Successfully',
        `You successfully joined Team "${findingTeamBooking.team_name}"'s ${team_size === '7' ? '7v7' : '5v5'} match on ${bookingDate} at ${timeSlot}. Please pay at the venue after playing.`,
        joiningBooking.id,
        findingTeamBooking.team_name
      );
    } catch (notificationError) {
      console.error('Failed to create team joining notifications:', notificationError);
    }

    res.json({
      success: true,
      data: {
        original_booking: findingTeamBooking,
        joining_booking: joiningBooking
      },
      message: 'Successfully joined the match! Both teams can proceed to payment.'
    });

  } catch (err) {
    await transaction.rollback();
    console.error('joinMatchmaking error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while joining the match'
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is authorized to cancel this booking
    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'court_manager') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled (not already cancelled)
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already cancelled'
      });
    }
    
    // Check if booking is within 1 hour of start time
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    const timeDiff = bookingDateTime - now;
    const hoursUntilBooking = timeDiff / (1000 * 60 * 60);
    
    if (hoursUntilBooking <= 1 && hoursUntilBooking >= 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel booking within 1 hour of start time'
      });
    }
    
    // Check if booking is from matchmaking (cannot be cancelled unless finding_team)
    if (booking.is_matchmaking && booking.status !== 'finding_team') {
      return res.status(400).json({
        success: false,
        error: 'Matchmaking bookings cannot be cancelled'
      });
    }

    // Store original status before updating
    const originalStatus = booking.status;
    
    // Update booking status to cancelled
    await booking.update({
      status: 'cancelled'
    }, { transaction });

    // Create cancellation notification
    const timeSlot = `${convertTo12Hour(booking.start_time)} - ${convertTo12Hour(booking.end_time)}`;
    const bookingDate = new Date(booking.booking_date).toLocaleDateString();
    
    const notificationTitle = originalStatus === 'finding_team' ? 'Team Finding Cancelled' : 'Booking Cancelled';
    let notificationMessage;
    
    if (originalStatus === 'finding_team') {
      notificationMessage = `Your team finding request for ${booking.court_type} match on ${bookingDate} at ${timeSlot} has been cancelled successfully.`;
      if (booking.payment_method === 'esewa') {
        notificationMessage += ' Note: Advanced payment of Rs 50 will not be refunded.';
      }
    } else {
      notificationMessage = `Your ${booking.court_type} booking for ${bookingDate} at ${timeSlot} has been cancelled successfully.`;
      if (booking.payment_method === 'esewa') {
        notificationMessage += ' Note: Advanced payment of Rs 50 will not be refunded.';
      }
    }
    
    await transaction.commit();

    // Emit real-time time slot update when booking is cancelled
    socketService.sendTimeSlotUpdate(booking.court_id, {
      date: booking.booking_date,
      updated_at: new Date()
    });

    // Create notification after transaction commit
    try {
      await createNotification(
        req.user.id,
        'booking_cancelled',
        notificationTitle,
        notificationMessage,
        booking.id
      );
    } catch (notificationError) {
      console.error('Failed to create cancellation notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (err) {
    await transaction.rollback();
    console.error('cancelBooking error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while cancelling the booking'
    });
  }
};

// Get available time slots for a court on a specific date
exports.getAvailableTimeSlots = async (req, res) => {
  // Check for expired bookings
  await exports.checkExpiredBookings();
  
  try {
    const { court_id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }

    // Check if court exists
    const court = await Court.findByPk(court_id);
    if (!court) {
      return res.status(404).json({
        success: false,
        error: 'Court not found'
      });
    }

    // Get existing bookings for the date (only confirmed bookings)
    const existingBookings = await Booking.findAll({
      where: {
        court_id,
        booking_date: date,
        status: 'confirmed'
      },
      attributes: ['start_time', 'end_time', 'court_type']
    });

    const allTimeSlots = [
      '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', 
      '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', 
      '12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM', '2:00 PM - 3:00 PM', 
      '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM',
      '6:00 PM - 7:00 PM', '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM',
    ];

    // Get matchmaking bookings (finding_team status)
    const matchmakingBookings = await Booking.findAll({
      where: {
        court_id,
        booking_date: date,
        status: 'finding_team'
      },
      attributes: ['start_time', 'end_time', 'court_type', 'team_name']
    });

    // Get current time for comparison
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    // Generate available time slots for each team size
    const availableSlots5v5 = allTimeSlots.map(slot => {
      const [startTimeStr, endTimeStr] = slot.split(' - ');
      const startTime = convertTo24Hour(startTimeStr);
      const endTime = convertTo24Hour(endTimeStr);
      
      // Check if time slot is in the past (only for today's date)
      // Add 15-minute buffer: slot becomes past 15 minutes before start time
      let isPastTime = false;
      if (date === today) {
        const [hours, minutes] = startTime.split(':');
        const slotStartTime = new Date();
        slotStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const bufferTime = new Date(slotStartTime.getTime() - 15 * 60 * 1000); // 15 minutes before
        isPastTime = now >= bufferTime;
      }
      
      const isBooked = existingBookings.some(b => 
        b.start_time === startTime && b.end_time === endTime && b.court_type === '5v5'
      );
      const findingTeam = matchmakingBookings.find(b => 
        b.start_time === startTime && b.end_time === endTime && b.court_type === '5v5'
      );
      
      if (isPastTime) {
        return { time: slot, team_size: '5', status: 'past' };
      } else if (isBooked) {
        return { time: slot, team_size: '5', status: 'booked' };
      } else if (findingTeam) {
        return { time: slot, team_size: '5', status: 'finding_team', team_name: findingTeam.team_name };
      } else {
        return { time: slot, team_size: '5', status: 'available' };
      }
    });
    
    const availableSlots7v7 = allTimeSlots.map(slot => {
      const [startTimeStr, endTimeStr] = slot.split(' - ');
      const startTime = convertTo24Hour(startTimeStr);
      const endTime = convertTo24Hour(endTimeStr);
      
      // Check if time slot is in the past (only for today's date)
      // Add 15-minute buffer: slot becomes past 15 minutes before start time
      let isPastTime = false;
      if (date === today) {
        const [hours, minutes] = startTime.split(':');
        const slotStartTime = new Date();
        slotStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const bufferTime = new Date(slotStartTime.getTime() - 15 * 60 * 1000); // 15 minutes before
        isPastTime = now >= bufferTime;
      }
      
      const isBooked = existingBookings.some(b => 
        b.start_time === startTime && b.end_time === endTime && b.court_type === '7v7'
      );
      const findingTeam = matchmakingBookings.find(b => 
        b.start_time === startTime && b.end_time === endTime && b.court_type === '7v7'
      );
      
      if (isPastTime) {
        return { time: slot, team_size: '7', status: 'past' };
      } else if (isBooked) {
        return { time: slot, team_size: '7', status: 'booked' };
      } else if (findingTeam) {
        return { time: slot, team_size: '7', status: 'finding_team', team_name: findingTeam.team_name };
      } else {
        return { time: slot, team_size: '7', status: 'available' };
      }
    });
    
    const availableSlots = [...availableSlots5v5, ...availableSlots7v7];

    res.json({
      success: true,
      data: {
        court_id,
        date,
        available_slots: availableSlots
      }
    });

  } catch (err) {
    console.error('getAvailableTimeSlots error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while fetching available time slots'
    });
  }
};

// Auto-complete bookings after match time and update payment status
exports.autoCompleteBookings = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    // Find confirmed bookings that have ended
    const completedBookings = await Booking.findAll({
      where: {
        status: 'confirmed',
        booking_date: currentDate
      }
    });
    
    for (const booking of completedBookings) {
      const bookingEndTime = new Date(`${booking.booking_date}T${booking.end_time}`);
      
      // If booking has ended, mark as completed and update payment status
      if (now > bookingEndTime) {
        await booking.update({
          status: 'completed',
          payment_status: 'paid'
        }, { transaction });
      }
    }
    
    await transaction.commit();
    console.log('Auto-complete check completed');
  } catch (error) {
    await transaction.rollback();
    console.error('Auto-complete error:', error);
  }
};

// Auto-cancel finding_team bookings that haven't found opponents within 2 hours
exports.autoCancelExpiredFindingTeam = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];
    
    // Find bookings that are finding_team and within 2 hours of start time
    const expiredBookings = await Booking.findAll({
      where: {
        status: 'finding_team',
        booking_date: currentDate
      }
    });
    
    for (const booking of expiredBookings) {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
      const timeDiff = bookingDateTime - now;
      const hoursUntilMatch = timeDiff / (1000 * 60 * 60);
      
      // If less than 2 hours until match time, cancel the booking
      if (hoursUntilMatch <= 2 && hoursUntilMatch >= 0) {
        await booking.update({
          status: 'cancelled'
        }, { transaction });
        
        // Create cancellation notification
        const timeSlot = `${convertTo12Hour(booking.start_time)} - ${convertTo12Hour(booking.end_time)}`;
        const bookingDate = new Date(booking.booking_date).toLocaleDateString();
        
        await createNotification(
          booking.user_id,
          'booking_cancelled',
          'Team Not Found',
          `No opponents found for your ${booking.court_type} match on ${bookingDate} at ${timeSlot}. Your booking has been automatically cancelled.`,
          booking.id
        );
      }
    }
    
    await transaction.commit();
    console.log('Auto-cancel check completed');
  } catch (error) {
    await transaction.rollback();
    console.error('Auto-cancel error:', error);
  }
};

// Auto-cancel team finding bookings 2 hours before booking time
exports.autoCancelTeamFinding = async () => {
  try {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    const bookingsToCancel = await Booking.findAll({
      where: {
        status: 'finding_team',
        booking_date: {
          [Op.gte]: now.toISOString().split('T')[0]
        }
      }
    });

    for (const booking of bookingsToCancel) {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
      
      if (bookingDateTime <= twoHoursFromNow) {
        await booking.update({ status: 'cancelled' });
        
        await createNotification(
          booking.user_id,
          'booking_cancelled',
          'Team Not Found',
          'No opponents found for your match. Your booking has been automatically cancelled.',
          booking.id
        );
      }
    }
  } catch (err) {
    console.error('autoCancelTeamFinding error:', err);
  }
};

// Check and auto-cancel expired bookings (runs on API calls)
exports.checkExpiredBookings = async () => {
  try {
    await exports.autoCancelTeamFinding();
    await exports.autoCancelExpiredFindingTeam();
    await exports.autoCompleteBookings();
  } catch (err) {
    console.error('checkExpiredBookings error:', err);
  }
};

// Run auto-cancel for expired finding_team bookings every 30 minutes
setInterval(exports.autoCancelExpiredFindingTeam, 30 * 60 * 1000);



// Get booking statistics (for court managers and admins)
exports.getBookingStats = async (req, res) => {
  try {
    const { court_id } = req.params;
    const { start_date, end_date } = req.query;

    // Verify the court belongs to the authenticated user (for court managers)
    if (req.user.role === 'court_manager') {
      const court = await Court.findOne({
        where: {
          id: court_id,
          court_manager_id: req.user.id
        }
      });

      if (!court) {
        return res.status(404).json({
          success: false,
          error: 'Court not found or unauthorized'
        });
      }
    }

    const whereClause = {};
    if (court_id) whereClause.court_id = court_id;
    if (start_date && end_date) {
      whereClause.booking_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const stats = await Booking.findAll({
      where: whereClause,
      attributes: [
        'status',
        'team_size',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status', 'team_size']
    });

    // Calculate summary statistics
    const totalBookings = await Booking.count({ where: whereClause });
    const pendingBookings = await Booking.count({ 
      where: { ...whereClause, status: 'pending' } 
    });
    const confirmedBookings = await Booking.count({ 
      where: { ...whereClause, status: 'confirmed' } 
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_bookings: totalBookings,
          pending_bookings: pendingBookings,
          confirmed_bookings: confirmedBookings
        },
        detailed_stats: stats
      }
    });

  } catch (err) {
    console.error('getBookingStats error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while fetching booking statistics'
    });
  }
};
