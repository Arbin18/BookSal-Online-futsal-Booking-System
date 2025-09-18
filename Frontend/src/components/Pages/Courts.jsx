import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, Star, Calendar, Sparkles, Award, Info, X, Check, Search, Phone, ArrowRight, Shield, Trophy } from 'lucide-react';
import axios from 'axios';
import Header from '../Header';
import Footer from '../Footer';
import { useSocket, useRatingUpdates } from '../../hooks/useSocket';
import AuthService from '../../services/AuthService';

const Courts = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Establish Socket.io connection
  const user = AuthService.getCurrentUser();
  const socket = useSocket(user?.token);

  // Real-time rating updates
  useRatingUpdates((data) => {
    setCourts(prevCourts => 
      prevCourts.map(court => 
        court.id === data.court_id 
          ? { ...court, averageRating: data.averageRating, totalRatings: data.totalRatings }
          : court
      )
    );
  });

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/courts`);
        setCourts(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load courts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, []);

  const filteredCourts = courts.filter(court =>
    court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    court.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDetailsClick = (court) => {
    navigate(`/courts/${court.id}`, { state: { court } });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #4a7c20 0%, #5c8c28 25%, #6b9b37 50%, #5c8c28 75%, #4a7c20 100%)',
      position: 'relative'
    }}>
      {/* Grass texture overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          rgba(255,255,255,0.03) 0px,
          transparent 1px,
          transparent 2px,
          rgba(255,255,255,0.03) 3px
        ),
        repeating-linear-gradient(
          90deg,
          rgba(0,0,0,0.05) 0px,
          transparent 1px,
          transparent 2px,
          rgba(0,0,0,0.05) 3px
        )`,
        pointerEvents: 'none'
      }}></div>
      
      <Header />
      
      {/* Hero Section with Grass Theme */}
      <section className="relative py-4 overflow-hidden">
        {/* Field lines pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-0 right-0 h-0.5 bg-white/20"></div>
          <div className="absolute bottom-20 left-0 right-0 h-0.5 bg-white/20"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full"></div>
        </div>
        
        {/* Floating grass particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-green-300/40 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-3 h-3 bg-green-400/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-2 h-2 bg-green-200/50 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-32 right-10 w-4 h-4 bg-green-300/20 rounded-full animate-pulse delay-1500"></div>
        
        <div className="relative container mx-auto px-4 text-center text-white">
          <div className="max-w-4xl mx-auto">
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              <span className="text-yellow-300 drop-shadow-lg">Futsal </span>
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">Courts</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-green-50">
              Step onto the field of champions. Discover premium futsal courts where legends are made and skills are forged.
            </p>
            
            {/* Search with golden accent */}
            <div className="max-w-lg mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 rounded-2xl blur-sm"></div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-yellow-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search courts by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-14 pr-5 py-4 text-base border-2 border-yellow-400/30 rounded-2xl bg-white/95 backdrop-blur-sm text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xl transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courts Listing with Grass Theme */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center space-x-4 bg-black/20 backdrop-blur-sm rounded-2xl px-8 py-6 border border-yellow-400/30">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
                <p className="text-yellow-100 text-xl font-bold">Loading Championship Courts...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="bg-red-900/40 backdrop-blur-sm border-2 border-red-400/60 rounded-3xl p-8 max-w-md mx-auto">
                <div className="bg-red-800/60 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-300" />
                </div>
                <p className="text-red-200 text-lg font-bold">{error}</p>
              </div>
            </div>
          ) : filteredCourts.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-black/20 backdrop-blur-sm border-2 border-yellow-400/40 rounded-3xl p-8 max-w-md mx-auto">
                <div className="bg-yellow-600/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-yellow-300" />
                </div>
                <p className="text-yellow-100 text-lg font-bold">No courts found in your search area.</p>
                <p className="text-green-200 mt-2">Try exploring different locations.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredCourts.map((court) => (
                <CourtCard 
                  key={court.id} 
                  court={court} 
                  onDetailsClick={() => handleDetailsClick(court)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Professional Court Card with White Background
const CourtCard = ({ court, onDetailsClick }) => {
  return (
    <div className="group bg-blue-100 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Card glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
      
      <div className="relative h-44 overflow-hidden rounded-t-2xl">
        <img 
          src={`http://localhost:5000/uploads/${court.image}`} 
          alt={court.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Field overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        
        {/* Premium badge - golden style */}
        {(court.averageRating || court.rating) >= 4.0 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-lg">
            <Award className="w-3 h-3 mr-1" />
            PREMIUM
          </div>
        )}
        
        {/* Rating badge - golden theme */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center shadow-lg">
          <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
          <span className="text-xs font-bold text-gray-800">{court.averageRating || court.rating}</span>
        </div>
      </div>
      
      <div className="relative p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-green-700 transition-colors duration-300">
          {court.name}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <div className="bg-green-50 p-1.5 rounded-lg mr-3">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <span className="font-medium">{court.location}</span>
          </div>
          
          <div className="flex items-center text-gray-600 text-sm">
            <div className="bg-blue-50 p-1.5 rounded-lg mr-3">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium">{court.opening_hours}</span>
          </div>
          
          <div className="flex items-center text-gray-600 text-sm">
            <div className="bg-purple-50 p-1.5 rounded-lg mr-3">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <span className="font-medium">{court.capacity}</span>
          </div>
          
          {court.phone_number && (
            <div className="flex items-center text-gray-600 text-sm">
              <div className="bg-red-50 p-1.5 rounded-lg mr-3">
                <Phone className="w-4 h-4 text-red-600" />
              </div>
              <span className="font-medium">{court.phone_number}</span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">{court.description}</p>
        
        {/* Professional Buttons without icons */}
        <div className="flex gap-3">
          <button
            onClick={onDetailsClick}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-all duration-300 border border-gray-200 hover:border-gray-300"
          >
            View Details
          </button>
          <Link
            to={`/booking/${court.id}`}
            state={{ court }}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg text-center"
          >
            BOOK NOW
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Courts;