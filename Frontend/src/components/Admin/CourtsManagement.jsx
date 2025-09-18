import React, { useEffect, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import { Trash2, MapPin, Users, Clock, Phone, Search, Filter, MoreVertical } from 'lucide-react';
import axios from 'axios';

const CourtsManagement = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourts, setFilteredCourts] = useState([]);

  useEffect(() => {
    fetchCourts();
  }, []);

  useEffect(() => {
    const filtered = courts.filter(court => 
      court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      court.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourts(filtered);
  }, [courts, searchTerm]);

  const fetchCourts = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const token = user?.token;
      
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/courts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const courtsData = response.data.data || [];
        setCourts(courtsData);
        setFilteredCourts(courtsData);
      }
    } catch (err) {
      console.error('Failed to fetch courts:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourt = async (courtId) => {
    if (!window.confirm('Are you sure you want to delete this court?')) return;

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const token = user?.token;

      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/courts/${courtId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedCourts = courts.filter(c => c.id !== courtId);
      setCourts(updatedCourts);
      setFilteredCourts(updatedCourts);
      alert('Court deleted successfully');
    } catch (err) {
      console.error('Failed to delete court:', err);
      alert('Failed to delete court');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-700 font-medium">Loading courts...</p>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-5xl">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="p-3 bg-purple-100 rounded-xl mr-4">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Courts Management</h1>
                    <p className="text-gray-600 mt-1">Manage and monitor all courts in the system</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {filteredCourts.length} Courts
                  </span>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search courts by name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <button className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                    <Filter className="w-5 h-5 mr-2" />
                    Filter
                  </button>
                </div>
              </div>
            </div>
            
            {filteredCourts.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
                  <MapPin className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">
                    {searchTerm ? 'No courts found' : 'No courts available'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Courts will appear here when they are added to the system.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Court</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hours</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCourts.map((court, index) => (
                        <tr key={court.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-3 bg-purple-100 rounded-xl mr-4">
                                <MapPin className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{court.name}</div>
                                <div className="text-xs text-gray-500">ID: {court.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{court.location}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-semibold text-gray-900">{court.capacity}</span>
                              <span className="text-xs text-gray-500 ml-1">players</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{court.opening_hours}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{court.phone_number || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => deleteCourt(court.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Court"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredCourts.map((court) => (
                    <div key={court.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <MapPin className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{court.name}</h3>
                            <p className="text-xs text-gray-500">ID: {court.id}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCourt(court.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{court.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{court.capacity} players</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{court.opening_hours}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{court.phone_number || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default CourtsManagement;