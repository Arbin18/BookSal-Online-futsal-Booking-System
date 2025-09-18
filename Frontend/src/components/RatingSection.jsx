import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import axios from 'axios';
import AuthService from '../services/AuthService';
import { useToast } from '../hooks/useToast';
import ToastContainer from './Toast/ToastContainer';

const RatingSection = ({ courtId }) => {
  const { toasts, showToast, removeToast } = useToast();
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated());
    fetchRatings();
    if (AuthService.isAuthenticated()) {
      fetchUserRating();
    }
  }, [courtId]);

  const fetchRatings = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/ratings/court/${courtId}`);
      if (response.data.success) {
        setRatings(response.data.data.ratings);
        setAverageRating(response.data.data.averageRating);
        setTotalRatings(response.data.data.totalRatings);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchUserRating = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ratings/user/${courtId}`,
        { headers: { Authorization: `Bearer ${AuthService.getToken()}` } }
      );
      if (response.data.success && response.data.data) {
        setUserRating(response.data.data);
        setNewRating(response.data.data.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const submitRating = async () => {
    if (!newRating) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ratings`,
        {
          court_id: courtId,
          rating: newRating
        },
        { headers: { Authorization: `Bearer ${AuthService.getToken()}` } }
      );

      if (response.data.success) {
        setShowRatingForm(false);
        fetchRatings();
        fetchUserRating();
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => onStarClick(star) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="bg-yellow-100 p-2 rounded-full mr-3">
          <Star className="w-5 h-5 text-yellow-600" />
        </span>
        Ratings
      </h2>

      {/* Average Rating Display */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-3xl font-bold text-gray-800 mr-2">
              {averageRating}
            </div>
            {renderStars(Math.round(averageRating))}

          </div>
          
          {isAuthenticated && (
            <button
              onClick={() => setShowRatingForm(!showRatingForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {userRating ? 'Update Rating' : 'Rate This Court'}
            </button>
          )}
        </div>
      </div>

      {/* Rating Form */}
      {showRatingForm && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            {userRating ? 'Update Your Rating' : 'Rate This Court'}
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            {renderStars(newRating, true, setNewRating)}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={submitRating}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
            <button
              onClick={() => setShowRatingForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Login Prompt for Non-authenticated Users */}
      {!isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Please <a href="/login" className="text-blue-600 hover:underline">login</a> to rate this court.
          </p>
        </div>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.length > 0 ? (
          ratings.map((rating) => (
            <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="bg-gray-200 rounded-full p-2 mr-3">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {rating.User?.full_name || 'Anonymous User'}
                    </div>
                    <div className="flex items-center">
                      {renderStars(rating.rating)}
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No ratings yet. Be the first to rate this court!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingSection;