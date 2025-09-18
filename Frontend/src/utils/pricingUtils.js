// Utility functions for pricing logic

/**
 * Check if a given date is Saturday
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if the date is Saturday
 */
export const isSaturday = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString + 'T00:00:00');
  return date.getDay() === 6;
};

/**
 * Get the appropriate price for a time slot based on date and team size
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {string} timeSlot - Time slot string
 * @param {string} teamSize - Team size ('5' or '7')
 * @param {Array} regularPricing - Array of regular pricing objects
 * @param {string} saturdayPrice - Saturday price for the team size
 * @returns {string|number} - Price for the time slot
 */
export const getPriceForTimeSlot = (dateString, timeSlot, teamSize, regularPricing, saturdayPrice) => {
  if (isSaturday(dateString) && saturdayPrice && saturdayPrice !== 'N/A') {
    return saturdayPrice;
  }
  
  const pricingItem = regularPricing.find(p => p.hour === timeSlot);
  return pricingItem?.price || 'N/A';
};

/**
 * Get pricing display for booking summary
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {string} teamSize - Team size ('5' or '7')
 * @param {Object} court - Court object with pricing data
 * @returns {Object} - Object with pricing information
 */
export const getPricingForBooking = (dateString, teamSize, court) => {
  const isSat = isSaturday(dateString);
  
  if (teamSize === '7') {
    return {
      isSaturday: isSat,
      saturdayPrice: court.saturdayPrice7v7,
      regularPricing: court.pricing7v7 || []
    };
  } else {
    return {
      isSaturday: isSat,
      saturdayPrice: court.saturdayPrice5v5,
      regularPricing: court.pricing5v5 || []
    };
  }
};