const { Court, Pricing, Rating, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Get manager's court with detailed pricing
exports.getManagerCourt = async (req, res) => {
  try {
    const court = await Court.findOne({
      where: { court_manager_id: req.user.id },
      include: [
        {
          model: Pricing,
          as: 'Pricings'
        },
        {
          model: Rating
        }
      ]
    });

    if (!court) {
      return res.status(404).json({ 
        success: false, 
        message: 'No court assigned to you' 
      });
    }

    // Get coordinates from Google Maps Geocoding API if API key is available
    let location = null;
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const geocodeResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(court.location)}&key=${GOOGLE_MAPS_API_KEY}`
        );
        
        location = geocodeResponse.data.results[0]?.geometry?.location || null;
      } catch (geocodeError) {
        console.error('Geocoding API error:', geocodeError.message);
        // Continue without location data if geocoding fails
      }
    }
    
    // Format the response to match frontend expectations
    const formattedCourt = court.toJSON();
    
    // Simple pricing without ground system
    const pricing5v5 = court.Pricings.filter(p => p.type === '5v5' && p.hour !== 'Saturday (Whole Day)');
    const pricing7v7 = court.Pricings.filter(p => p.type === '7v7' && p.hour !== 'Saturday (Whole Day)');
    const saturdayPrice5v5 = court.Pricings.find(p => p.type === '5v5' && p.hour === 'Saturday (Whole Day)')?.price || '';
    const saturdayPrice7v7 = court.Pricings.find(p => p.type === '7v7' && p.hour === 'Saturday (Whole Day)')?.price || '';
    
    formattedCourt.pricing5v5 = pricing5v5;
    formattedCourt.pricing7v7 = pricing7v7;
    formattedCourt.saturdayPrice5v5 = saturdayPrice5v5;
    formattedCourt.saturdayPrice7v7 = saturdayPrice7v7;
    
    // Calculate average rating from actual ratings
    if (formattedCourt.Ratings && formattedCourt.Ratings.length > 0) {
      const totalRating = formattedCourt.Ratings.reduce((sum, rating) => sum + rating.rating, 0);
      formattedCourt.averageRating = (totalRating / formattedCourt.Ratings.length).toFixed(1);
      formattedCourt.totalRatings = formattedCourt.Ratings.length;
    } else {
      formattedCourt.averageRating = formattedCourt.rating || 3.0;
      formattedCourt.totalRatings = 0;
    }
    
    res.json({ 
      success: true, 
      data: {
        ...formattedCourt,
        location_coords: location
      }
    });
  } catch (err) {
    console.error('getManagerCourt error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request'
    });
  }
};

// Create or update court with detailed pricing
exports.manageCourt = async (req, res) => {
  
  console.log('=== manageCourt function called ===');
  console.log('HTTP Method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request params:', req.params);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('User ID:', req.user.id);
  console.log('User role:', req.user.role);
  
  const transaction = await sequelize.transaction();
  try {
    const { 
      pricing, 
      pricing5v5, 
      pricing7v7, 
      saturdayPrice, 
      saturdayPrice5v5, 
      saturdayPrice7v7,
      location, 
      latitude, 
      longitude, 
      phone_number,
      ...otherCourtData 
    } = req.body;
    
    console.log('Extracted data:', {
      pricing5v5,
      pricing7v7,
      saturdayPrice5v5,
      saturdayPrice7v7,
      location,
      phone_number,
      otherCourtData
    });
    
    // Set manager ID and other court data
    const courtData = {
      court_manager_id: req.user.id,
      location: location,
      phone_number: phone_number
    };
    
    // Only add other fields if they exist and are not capacity
    if (otherCourtData.name) courtData.name = otherCourtData.name;
    if (otherCourtData.opening_hours) courtData.opening_hours = otherCourtData.opening_hours;
    if (otherCourtData.description) courtData.description = otherCourtData.description;
    if (otherCourtData.rating) courtData.rating = otherCourtData.rating;
    
    // Add capacity field for new courts (required field)
    if (otherCourtData.capacity) {
      courtData.capacity = otherCourtData.capacity;
    }
    
    // Validate that no undefined values are being sent
    Object.keys(courtData).forEach(key => {
      if (courtData[key] === undefined) {
        console.log(`Warning: ${key} is undefined, removing from courtData`);
        delete courtData[key];
      }
    });
    
    console.log('otherCourtData received:', otherCourtData);
    console.log('Filtered courtData (capacity excluded):', courtData);
    
    // Store coordinates and map_url
    if (latitude && longitude) {
      courtData.latitude = parseFloat(latitude);
      courtData.longitude = parseFloat(longitude);
      courtData.map_url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      // Get location name from reverse geocoding
      if (GOOGLE_MAPS_API_KEY) {
        try {
          const reverseGeocodeResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
          );
          
          if (reverseGeocodeResponse.data.results[0]) {
            courtData.location_name = reverseGeocodeResponse.data.results[0].formatted_address;
          }
        } catch (reverseGeocodeError) {
          console.error('Reverse geocoding error:', reverseGeocodeError.message);
        }
      }
    } else {
      // Set a default map_url if no coordinates provided
      courtData.map_url = `https://www.google.com/maps?q=${encodeURIComponent(location || 'Unknown Location')}`;
    }

    // Handle image upload
    if (req.file) {
      courtData.image = req.file.filename;
    }

    console.log('Final court data:', courtData);
    console.log('map_url value:', courtData.map_url);
    console.log('All courtData fields:', Object.keys(courtData));
    console.log('Capacity field included for new courts, excluded for updates');

    // Check table structure to debug the issue
    try {
      const tableInfo = await sequelize.query("DESCRIBE courts", { type: sequelize.QueryTypes.SELECT });
      console.log('Table structure:', tableInfo);
    } catch (tableError) {
      console.log('Error checking table structure:', tableError.message);
    }

    // Check if this is a POST (create) or PUT (update) request
    const isCreating = req.method === 'POST';
    const courtId = req.params.id;
    
    console.log('=== Request Analysis ===');
    console.log('isCreating:', isCreating);
    console.log('courtId:', courtId);
    console.log('req.method === "POST":', req.method === 'POST');
    console.log('req.method type:', typeof req.method);
    console.log('req.method value:', req.method);
    
    let court;
    
    if (isCreating) {
      // Creating a new court
      console.log('✅ ENTERING CREATE PATH - This is a POST request');
      
      // Validate required fields for new courts
      if (!courtData.capacity) {
        console.log('❌ Capacity validation failed');
        return res.status(400).json({
          success: false,
          error: 'Capacity is required when creating a new court'
        });
      }
      
      console.log('✅ Capacity validation passed');
      
      // Check if user already has a court
      const existingCourt = await Court.findOne({
        where: { court_manager_id: req.user.id }
      });
      
      if (existingCourt) {
        console.log('❌ User already has a court');
        return res.status(400).json({
          success: false,
          error: 'You already have a court. Each court manager can only have one court.'
        });
      }
      
      console.log('✅ No existing court found, proceeding with creation');
      
      // Create new court
      court = await Court.create(courtData, { transaction });
      console.log('✅ New court created successfully:', court.toJSON());
      
    } else {
      // Updating existing court
      console.log('❌ ENTERING UPDATE PATH - This is a PUT request');
      console.log('Updating court with ID:', courtId);
      court = await Court.findByPk(courtId);
      if (!court) {
        console.log('❌ Court not found with ID:', courtId);
        return res.status(404).json({ 
          success: false, 
          error: 'Court not found' 
        });
      }
      
      // Verify ownership
      if (court.court_manager_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own court'
        });
      }

      // If updating with new image, delete the old one
      if (req.file && court.image) {
        const oldImagePath = path.join(__dirname, '../uploads', court.image);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('Old image deleted:', court.image);
          }
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }

      console.log('Found existing court:', court.toJSON());
      console.log('Updating with data:', courtData);

      // Update the court with new data
      await court.update(courtData, { transaction });
      console.log('Court updated successfully:', court.toJSON());
    }

    // Delete existing pricing
    await Pricing.destroy({
      where: { court_id: court.id },
      transaction
    });

    // Create new pricing records
    let pricingRecords = [];
    
    // Helper function to sanitize pricing data
    const sanitizePricing = (pricingData) => {
      const filtered = pricingData.filter(item => {
        // Allow items with price 0 or any valid number
        const hasValidPrice = item.price !== undefined && item.price !== null && item.price !== '';
        return hasValidPrice;
      });
      
      const sanitized = filtered.map(price => ({
        ...price,
        price: parseFloat(price.price) || 0, // Convert to number, default to 0
        court_id: court.id
      }));
      
      return sanitized;
    };

    // Handle simple pricing without ground system
    if (pricing5v5) {
      const parsedPricing5v5 = typeof pricing5v5 === 'string' ? JSON.parse(pricing5v5) : pricing5v5;
      console.log('Parsed 5v5 pricing:', parsedPricing5v5);
      const sanitized5v5 = sanitizePricing(parsedPricing5v5);
      pricingRecords.push(...sanitized5v5.map(price => ({
        ...price,
        type: '5v5'
      })));
    }
    
    if (pricing7v7) {
      const parsedPricing7v7 = typeof pricing7v7 === 'string' ? JSON.parse(pricing7v7) : pricing7v7;
      console.log('Parsed 7v7 pricing:', parsedPricing7v7);
      const sanitized7v7 = sanitizePricing(parsedPricing7v7);
      pricingRecords.push(...sanitized7v7.map(price => ({
        ...price,
        type: '7v7'
      })));
    }
    
    // Handle legacy single pricing (for backward compatibility)
    if (pricing && !pricing5v5 && !pricing7v7) {
      const parsedPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
      pricingRecords.push(...sanitizePricing(parsedPricing).map(price => ({
        ...price,
        type: 'general'
      })));
    }

    // Add Saturday pricing
    if (saturdayPrice5v5 && saturdayPrice5v5 !== '') {
      pricingRecords.push({
        hour: 'Saturday (Whole Day)',
        price: parseFloat(saturdayPrice5v5) || 0,
        court_id: court.id,
        type: '5v5'
      });
    }
    
    if (saturdayPrice7v7 && saturdayPrice7v7 !== '') {
      pricingRecords.push({
        hour: 'Saturday (Whole Day)',
        price: parseFloat(saturdayPrice7v7) || 0,
        court_id: court.id,
        type: '7v7'
      });
    }
    
    // Handle legacy Saturday price
    if (saturdayPrice && saturdayPrice !== '' && !saturdayPrice5v5 && !saturdayPrice7v7) {
      pricingRecords.push({
        hour: 'Saturday (Whole Day)',
        price: parseFloat(saturdayPrice) || 0,
        court_id: court.id,
        type: 'general'
      });
    }

    console.log('Final pricing records:', pricingRecords);

    // Only create pricing records if we have valid data
    if (pricingRecords.length > 0) {
      await Pricing.bulkCreate(pricingRecords, { transaction });
      console.log('Pricing records created successfully');
    }

    await transaction.commit();
    console.log('Transaction committed successfully');
    
    // Fetch updated court with pricing and format the response
    const result = await Court.findByPk(court.id, {
      include: { model: Pricing, as: 'Pricings' }
    });

    // Format the response to match frontend expectations
    const formattedResult = result.toJSON();

    formattedResult.image = `/uploads/${formattedResult.image}`;
    
    // Simple pricing without ground system
    const resultPricing5v5 = result.Pricings.filter(p => p.type === '5v5' && p.hour !== 'Saturday (Whole Day)');
    const resultPricing7v7 = result.Pricings.filter(p => p.type === '7v7' && p.hour !== 'Saturday (Whole Day)');
    const resultSaturdayPrice5v5 = result.Pricings.find(p => p.type === '5v5' && p.hour === 'Saturday (Whole Day)')?.price || '';
    const resultSaturdayPrice7v7 = result.Pricings.find(p => p.type === '7v7' && p.hour === 'Saturday (Whole Day)')?.price || '';
    
    formattedResult.pricing5v5 = resultPricing5v5;
    formattedResult.pricing7v7 = resultPricing7v7;
    formattedResult.saturdayPrice5v5 = resultSaturdayPrice5v5;
    formattedResult.saturdayPrice7v7 = resultSaturdayPrice7v7;

    console.log('Formatted response:', formattedResult);

    // Set appropriate status and message based on operation
    const statusCode = isCreating ? 201 : 200;
    const message = isCreating ? 'Court created successfully' : 'Court updated successfully';

    res.status(statusCode).json({ 
      success: true, 
      data: formattedResult,
      message: message
    });
  } catch (err) {
    await transaction.rollback();
    console.error('manageCourt error:', err);
    // Provide more detailed error information
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error',
        details: err.errors.map(e => e.message)
      });
    }
    if (err.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ 
        success: false, 
        error: 'Database error',
        details: err.message
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request'
    });
  }
};

// Get all courts
exports.getAllCourts = async (req, res) => {
  try {
    const courts = await Court.findAll({
      include: [
        {
          model: Pricing,
          as: 'Pricings'
        },
        {
          model: Rating
        }
      ]
    });

    const courtsWithMapData = courts.map(court => {
      const courtData = court.toJSON();
      
      // Add map display data
      if (courtData.latitude && courtData.longitude) {
        courtData.map_display = {
          latitude: courtData.latitude,
          longitude: courtData.longitude,
          location_name: courtData.location_name || `${courtData.latitude}, ${courtData.longitude}`
        };
      }
      
      // Calculate average rating from actual ratings
      if (courtData.Ratings && courtData.Ratings.length > 0) {
        const totalRating = courtData.Ratings.reduce((sum, rating) => sum + rating.rating, 0);
        courtData.averageRating = (totalRating / courtData.Ratings.length).toFixed(1);
        courtData.totalRatings = courtData.Ratings.length;
      } else {
        courtData.averageRating = courtData.rating || 3.0;
        courtData.totalRatings = 0;
      }
      
      return courtData;
    });

    res.json({ 
      success: true, 
      data: courtsWithMapData 
    });
  } catch (err) {
    console.error('getAllCourts error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request'
    });
  }
};

// Get court by ID
exports.getCourtById = async (req, res) => {
  try {
    const court = await Court.findByPk(req.params.id, {
      include: [
        {
          model: Pricing,
          as: 'Pricings'
        },
        {
          model: Rating,
          include: [{
            model: User,
            attributes: ['id', 'full_name']
          }],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!court) {
      return res.status(404).json({ 
        success: false, 
        message: 'Court not found' 
      });
    }

    const courtData = court.toJSON();
    
    // Add map display data
    if (courtData.latitude && courtData.longitude) {
      courtData.map_display = {
        latitude: courtData.latitude,
        longitude: courtData.longitude,
        location_name: courtData.location_name || `${courtData.latitude}, ${courtData.longitude}`
      };
    }

    // Calculate average rating from actual ratings
    if (courtData.Ratings && courtData.Ratings.length > 0) {
      const totalRating = courtData.Ratings.reduce((sum, rating) => sum + rating.rating, 0);
      courtData.averageRating = (totalRating / courtData.Ratings.length).toFixed(1);
      courtData.totalRatings = courtData.Ratings.length;
    } else {
      courtData.averageRating = courtData.rating || 3.0;
      courtData.totalRatings = 0;
    }

    res.json({ 
      success: true, 
      data: courtData 
    });
  } catch (err) {
    console.error('getCourtById error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request'
    });
  }
};

// Delete court
exports.deleteCourt = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const court = await Court.findByPk(req.params.id);
    
    if (!court) {
      return res.status(404).json({ 
        success: false, 
        message: 'Court not found' 
      });
    }

    // Check if user is authorized to delete this court
    if (court.court_manager_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to delete this court' 
      });
    }

    // Delete related pricing records first
    await Pricing.destroy({
      where: { court_id: court.id },
      transaction
    });

    // Delete the court
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
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request'
    });
  }
};
