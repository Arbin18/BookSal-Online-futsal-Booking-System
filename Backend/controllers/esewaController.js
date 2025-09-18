const crypto = require('crypto');
const { Booking, Court } = require('../models');

// eSewa configuration
const ESEWA_CONFIG = {
  merchant_code: process.env.ESEWA_MERCHANT_ID || 'EPAYTEST',
  secret_key: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
  success_url: process.env.ESEWA_SUCCESS_URL || 'http://localhost:5000/api/esewa/success',
  failure_url: process.env.ESEWA_FAILURE_URL || 'http://localhost:5000/api/esewa/failure',
  form_url: process.env.ESEWA_BASE_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
};

// Generate HMAC signature for eSewa
const generateSignature = (data, secretKey) => {
  const message = `total_amount=${data.total_amount},transaction_uuid=${data.transaction_uuid},product_code=${data.product_code}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
};

// Initiate eSewa payment
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // Get booking details
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Court, attributes: ['name'] }]
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Check if user owns this booking
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to booking'
      });
    }
    
    // Generate unique transaction UUID
    const transaction_uuid = `BK${bookingId}_${Date.now()}`;
    
    // Payment amount (Rs. 50 advance)
    const amount = 50;
    const tax_amount = 0;
    const total_amount = amount + tax_amount;
    
    // Prepare eSewa payment data
    const paymentData = {
      amount: amount.toString(),
      tax_amount: tax_amount.toString(),
      total_amount: total_amount.toString(),
      transaction_uuid,
      product_code: ESEWA_CONFIG.merchant_code,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: ESEWA_CONFIG.success_url,
      failure_url: ESEWA_CONFIG.failure_url,
      signed_field_names: 'total_amount,transaction_uuid,product_code'
    };
    
    // Generate signature
    const signature = generateSignature(paymentData, ESEWA_CONFIG.secret_key);
    paymentData.signature = signature;
    
    // Store transaction details in booking
    await booking.update({
      esewa_transaction_uuid: transaction_uuid,
      payment_status: 'pending'
    });
    
    res.json({
      success: true,
      data: {
        form_url: ESEWA_CONFIG.form_url,
        payment_data: paymentData,
        booking_details: {
          id: booking.id,
          court_name: booking.Court?.name,
          total_price: booking.total_price
        }
      }
    });
    
  } catch (error) {
    console.error('eSewa payment initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate payment'
    });
  }
};

// Handle eSewa success callback
exports.handleSuccess = async (req, res) => {
  try {
    console.log('eSewa success callback params:', req.query);
    
    // eSewa sends data as base64 encoded JSON
    const { data } = req.query;
    if (!data) {
      console.log('Missing data parameter in success callback');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure?error=missing_data`);
    }
    
    // Decode the base64 data
    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    console.log('Decoded eSewa data:', decodedData);
    
    const { transaction_uuid, transaction_code, status, total_amount } = decodedData;
    
    if (!transaction_uuid) {
      console.log('Missing transaction UUID in decoded data');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure?error=missing_transaction`);
    }
    
    // Find booking by transaction UUID
    const booking = await Booking.findOne({
      where: { esewa_transaction_uuid: transaction_uuid },
      include: [{ model: Court, attributes: ['name'] }]
    });
    
    if (!booking) {
      console.log('Booking not found for transaction:', transaction_uuid);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure?error=booking_not_found`);
    }
    
    // Update booking status
    await booking.update({
      status: 'confirmed',
      payment_method: 'esewa',
      payment_status: 'advance_paid',
      esewa_transaction_code: transaction_code
    });
    
    console.log('Payment successful for booking:', booking.id);
    
    // Create booking confirmation notification
    try {
      const { Notification } = require('../models');
      
      // Helper function to convert 24-hour format to 12-hour format
      const convertTo12Hour = (time24h) => {
        const [hours, minutes] = time24h.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      };
      
      const timeSlot = `${convertTo12Hour(booking.start_time)} - ${convertTo12Hour(booking.end_time)}`;
      const bookingDate = new Date(booking.booking_date).toLocaleDateString();
      
      await Notification.create({
        user_id: booking.user_id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your ${booking.court_type} booking for ${bookingDate} at ${timeSlot} has been confirmed via eSewa. Total amount: Rs. ${booking.total_price}.`,
        booking_id: booking.id
      });
      
      console.log('eSewa booking confirmation notification created');
    } catch (notificationError) {
      console.error('Failed to create eSewa booking notification:', notificationError);
    }
    
    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?transaction_uuid=${transaction_uuid}&transaction_code=${transaction_code}&amount_paid=50&remaining_amount=${booking.total_price - 50}`);
    
  } catch (error) {
    console.error('eSewa success callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure?error=processing_failed`);
  }
};

// Handle eSewa failure callback
exports.handleFailure = async (req, res) => {
  try {
    const { transaction_uuid } = req.query;
    
    if (transaction_uuid) {
      // Find and update booking
      const booking = await Booking.findOne({
        where: { esewa_transaction_uuid: transaction_uuid }
      });
      
      if (booking) {
        await booking.update({
          payment_status: 'failed'
        });
      }
    }
    
    // Redirect to frontend failure page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure?transaction_uuid=${transaction_uuid || ''}`);
    
  } catch (error) {
    console.error('eSewa failure callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure?error=processing_failed`);
  }
};