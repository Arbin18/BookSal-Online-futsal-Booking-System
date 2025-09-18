const { Rating, Court, User } = require('../models');
const sequelize = require('../config/db');
const socketService = require('../services/socketService');

// Submit or update a rating
exports.submitRating = async (req, res) => {
  try {
    const { court_id, rating } = req.body;
    const user_id = req.user.id;

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
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

    // Check if user has already rated this court
    const existingRating = await Rating.findOne({
      where: { user_id, court_id }
    });

    let ratingRecord;
    if (existingRating) {
      // Update existing rating
      await existingRating.update({ rating });
      ratingRecord = existingRating;
    } else {
      // Create new rating
      ratingRecord = await Rating.create({
        user_id,
        court_id,
        rating
      });
    }

    // Calculate new average rating for the court
    const avgRating = await Rating.findOne({
      where: { court_id },
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']]
    });

    // Update court's average rating
    const newAvgRating = parseFloat(avgRating.dataValues.avgRating).toFixed(1);
    await court.update({
      rating: newAvgRating
    });

    // Get total ratings count
    const totalRatings = await Rating.count({ where: { court_id } });

    // Emit real-time rating update
    socketService.sendRatingUpdate(court_id, {
      averageRating: newAvgRating,
      totalRatings: totalRatings,
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: ratingRecord,
      message: existingRating ? 'Rating updated successfully' : 'Rating submitted successfully'
    });
  } catch (err) {
    console.error('submitRating error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get ratings for a court
exports.getCourtRatings = async (req, res) => {
  try {
    const { court_id } = req.params;

    const ratings = await Rating.findAll({
      where: { court_id },
      include: [{
        model: User,
        attributes: ['id', 'full_name']
      }],
      order: [['created_at', 'DESC']]
    });

    // Calculate average rating
    const avgRating = await Rating.findOne({
      where: { court_id },
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']]
    });

    res.json({
      success: true,
      data: {
        ratings,
        averageRating: avgRating.dataValues.avgRating ? parseFloat(avgRating.dataValues.avgRating).toFixed(1) : 0,
        totalRatings: ratings.length
      }
    });
  } catch (err) {
    console.error('getCourtRatings error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user's rating for a specific court
exports.getUserRating = async (req, res) => {
  try {
    const { court_id } = req.params;
    const user_id = req.user.id;

    const rating = await Rating.findOne({
      where: { user_id, court_id }
    });

    res.json({
      success: true,
      data: rating
    });
  } catch (err) {
    console.error('getUserRating error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  submitRating: exports.submitRating,
  getCourtRatings: exports.getCourtRatings,
  getUserRating: exports.getUserRating
};