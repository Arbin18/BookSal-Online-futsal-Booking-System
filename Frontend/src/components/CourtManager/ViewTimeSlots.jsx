import React, { useEffect, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import axios from 'axios';

const ViewTimeSlots = () => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [courtId, setCourtId] = useState(null);
  const [courtCapacity, setCourtCapacity] = useState([]);

  const allTimeSlots = [
    '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM', '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM', '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM'
  ];

  useEffect(() => {
    const fetchCourtAndSlots = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const token = user?.token;
        
        if (!token) return;
        
        // Get court details first
        const courtRes = await axios.get(`${import.meta.env.VITE_API_URL}/courts/manager`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const courtData = courtRes.data.success ? courtRes.data.data : courtRes.data;
        setCourtId(courtData.id);
        setCourtCapacity(courtData.capacity || []);
        
        if (courtData?.id) {
          fetchTimeSlots(courtData.id, selectedDate);
        }
      } catch (err) {
        console.error('Failed to fetch court:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourtAndSlots();
  }, []);

  const fetchTimeSlots = async (courtId, date) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/bookings/court/${courtId}/available-slots?date=${date}`);
      if (response.data.success) {
        setTimeSlots(response.data.data.available_slots || []);
      }
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (courtId) {
      fetchTimeSlots(courtId, date);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-red-100 text-red-800';
      case 'finding_team': return 'bg-yellow-100 text-yellow-800';
      case 'past': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status, teamName) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'finding_team': return `Finding Team (${teamName})`;
      case 'past': return 'Past';
      default: return status;
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex md:flex-row flex-col relative">
          <Sidebar />
          <main className="flex-1 p-6 bg-gray-50 min-h-screen w-full">
            <div className="text-center">Loading...</div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex md:flex-row flex-col relative">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50 min-h-screen w-full">
          <h1 className="text-3xl font-semibold mb-6">View Time Slots</h1>
          
          {/* Date Selector */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className={`grid grid-cols-1 ${courtCapacity.length === 2 ? 'lg:grid-cols-2' : ''} gap-6`}>
            {/* 5v5 Time Slots */}
            {courtCapacity.includes('5v5') && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-blue-600 text-white px-6 py-3">
                  <h2 className="text-xl font-semibold">5v5 Court</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Slot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots
                        .filter(slot => slot.team_size === '5')
                        .map((slot, index) => (
                          <tr key={`5v5-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {slot.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(slot.status)}`}>
                                {getStatusText(slot.status, slot.team_name)}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7v7 Time Slots */}
            {courtCapacity.includes('7v7') && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-green-600 text-white px-6 py-3">
                  <h2 className="text-xl font-semibold">7v7 Court</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Slot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots
                        .filter(slot => slot.team_size === '7')
                        .map((slot, index) => (
                          <tr key={`7v7-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {slot.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(slot.status)}`}>
                                {getStatusText(slot.status, slot.team_name)}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <h3 className="text-lg font-semibold mb-3">Status Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                <span className="text-sm text-gray-600">Slot is open for booking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Booked</span>
                <span className="text-sm text-gray-600">Slot is already booked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Finding Team</span>
                <span className="text-sm text-gray-600">Team looking for opponents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Past</span>
                <span className="text-sm text-gray-600">Time slot has passed</span>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default ViewTimeSlots;