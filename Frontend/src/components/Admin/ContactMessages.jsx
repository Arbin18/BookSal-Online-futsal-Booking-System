import { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Mail, Phone, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import AuthService from '../../services/AuthService';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import { useNotifications, useContactMessages } from '../../hooks/useSocket';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  // Handle real-time contact message notifications
  const handleNewNotification = (notification) => {
    if (notification.type === 'contact_received') {
      fetchMessages();
    }
  };

  // Handle new contact messages
  const handleNewContactMessage = (contactMessage) => {
    console.log('New contact message received:', contactMessage);
    setMessages(prev => [contactMessage, ...prev]);
  };

  useNotifications(handleNewNotification);
  useContactMessages(handleNewContactMessage);

  const fetchMessages = async () => {
    try {
      const user = AuthService.getCurrentUser();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/contact-messages`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    
    setSending(true);
    try {
      const user = AuthService.getCurrentUser();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/contact-messages/${selectedMessage.id}/reply`,
        { reply: replyText },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );
      
      if (response.data.success) {
        alert('Reply sent successfully!');
        setReplyText('');
        setSelectedMessage(null);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
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
              <p className="text-lg text-gray-700 font-medium">Loading messages...</p>
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
        <main className="flex-1 p-4 md:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Contact Messages</h1>
                    <p className="text-gray-600 mt-1">Manage and respond to customer inquiries</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
                  <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">No messages found</h3>
                  <p className="text-gray-500">Customer messages will appear here when they contact you.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                      {messages.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id}>
                        <div
                          onClick={() => setSelectedMessage(selectedMessage?.id === message.id ? null : message)}
                          className={`group p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedMessage?.id === message.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900">{message.name}</span>
                                <div className="flex items-center mt-1">
                                  <Mail className="w-3 h-3 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-500 truncate">{message.email}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                              {message.replied ? (
                                <div className="flex items-center mt-1">
                                  <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                                  <span className="text-xs text-green-600 font-medium">Replied</span>
                                </div>
                              ) : (
                                <div className="flex items-center mt-1">
                                  <AlertCircle className="w-3 h-3 text-orange-500 mr-1" />
                                  <span className="text-xs text-orange-600 font-medium">Pending</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="text-sm font-semibold text-gray-800 line-clamp-1">{message.subject}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                        </div>
                        
                        {selectedMessage?.id === message.id && (
                          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-xl font-bold text-gray-900">Message Details</h3>
                              {selectedMessage.replied ? (
                                <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Replied
                                </span>
                              ) : (
                                <span className="flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  Pending Reply
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center mb-2">
                                  <User className="w-5 h-5 text-gray-500 mr-2" />
                                  <span className="text-sm font-medium text-gray-600">Name</span>
                                </div>
                                <span className="font-semibold text-gray-900">{selectedMessage.name}</span>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center mb-2">
                                  <Mail className="w-5 h-5 text-gray-500 mr-2" />
                                  <span className="text-sm font-medium text-gray-600">Email</span>
                                </div>
                                <span className="font-semibold text-gray-900">{selectedMessage.email}</span>
                              </div>
                              {selectedMessage.phone && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                  <div className="flex items-center mb-2">
                                    <Phone className="w-5 h-5 text-gray-500 mr-2" />
                                    <span className="text-sm font-medium text-gray-600">Phone</span>
                                  </div>
                                  <span className="font-semibold text-gray-900">{selectedMessage.phone}</span>
                                </div>
                              )}
                              <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center mb-2">
                                  <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                                  <span className="text-sm font-medium text-gray-600">Received</span>
                                </div>
                                <span className="font-semibold text-gray-900">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="mb-6">
                              <h4 className="text-lg font-semibold mb-3 text-gray-900">Subject</h4>
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-blue-900 font-semibold">{selectedMessage.subject}</p>
                              </div>
                            </div>

                            <div className="mb-6">
                              <h4 className="text-lg font-semibold mb-3 text-gray-900">Message</h4>
                              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                              </div>
                            </div>

                            {selectedMessage.replied ? (
                              <div>
                                <h4 className="text-lg font-semibold mb-3 text-gray-900">Your Reply</h4>
                                <div className="p-6 bg-green-50 border border-green-200 rounded-xl border-l-4 border-l-green-500">
                                  <p className="text-green-900 leading-relaxed whitespace-pre-wrap">
                                    {selectedMessage.reply_message}
                                  </p>
                                </div>
                                <div className="flex items-center mt-4 text-green-600">
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  <span className="font-medium">Reply sent successfully</span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-lg font-semibold mb-3 text-gray-900">Send Reply</h4>
                                <div className="space-y-4">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your professional reply here..."
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                    rows="6"
                                  />
                                  <button
                                    onClick={sendReply}
                                    disabled={!replyText.trim() || sending}
                                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg hover:shadow-xl"
                                  >
                                    <Send className="w-5 h-5 mr-2" />
                                    {sending ? 'Sending Reply...' : 'Send Reply'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default ContactMessages;