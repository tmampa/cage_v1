'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import emailjs from '@emailjs/browser';

export default function FeedbackButton() {
  const { user, userProfile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [feedbackType, setFeedbackType] = useState('general'); // 'bug', 'feature', 'general'

  // Debug EmailJS configuration on component mount
  React.useEffect(() => {
    console.log('EmailJS Configuration Check:');
    console.log('Service ID:', process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID);
    console.log('Template ID:', process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID);
    console.log('Public Key:', process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    
    // Initialize EmailJS with public key
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init(publicKey);
      console.log('EmailJS initialized with public key');
    } else {
      console.error('EmailJS public key not found');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if EmailJS credentials are available
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS credentials are not properly configured. Please check your environment variables.');
      }

      // Create the email template parameters
      // Note: The recipient email should be configured in the EmailJS template, not sent as a parameter
      const templateParams = {
        from_name: userProfile?.username || 'Anonymous User',
        from_email: email || user?.email || 'anonymous@cage-game.com',
        reply_to: email || user?.email || 'anonymous@cage-game.com',
        user_id: user?.id || 'guest',
        feedback_type: feedbackType,
        rating: rating,
        message: feedback,
        timestamp: new Date().toLocaleString(),
        user_score: userProfile?.score || 0,
      };

      console.log('Sending feedback with EmailJS...', { serviceId, templateId });
      console.log('Template parameters:', templateParams);

      // Send email using EmailJS (public key already initialized)
      const result = await emailjs.send(
        serviceId,
        templateId,
        templateParams
      );

      console.log('Feedback sent successfully:', result.text);
      setSubmitStatus('success');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFeedback('');
        setRating(0);
        setEmail('');
        setFeedbackType('general');
        setSubmitStatus(null);
        setIsModalOpen(false);
      }, 2000);

    } catch (error) {
      console.error('Error sending feedback:', error);
      
      // Provide more specific error feedback to user
      if (error.message?.includes('EmailJS credentials')) {
        console.error('EmailJS Configuration Error:', error.message);
      } else if (error.text) {
        console.error('EmailJS Service Error:', error.text);
      } else {
        console.error('Unexpected Error:', error);
      }
      
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starNumber) => {
    setRating(starNumber);
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        style={{ 
          background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </motion.button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="game-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-purple-700">
                  Send Feedback 💬
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Success/Error Messages */}
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4"
                >
                  Thanks for your feedback! We'll read it carefully. 🎉
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4"
                >
                  Please write some feedback before sending! 😊
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    What type of feedback is this?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'general', label: 'General', emoji: '💭' },
                      { value: 'bug', label: 'Bug Report', emoji: '🐛' },
                      { value: 'feature', label: 'Feature Idea', emoji: '💡' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFeedbackType(type.value)}
                        className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                          feedbackType === type.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        <div>{type.emoji}</div>
                        <div>{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    How would you rate CagE? ⭐
                  </label>
                  <div className="flex justify-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        className="transition-colors"
                      >
                        <StarIcon
                          className={`w-8 h-8 ${
                            star <= rating
                              ? 'text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email (for non-logged-in users) */}
                {!user && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Your Email (optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your-email@example.com"
                    />
                  </div>
                )}

                {/* Feedback Message */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Your Feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Tell us what you think about CagE! What do you love? What could be better? Any bugs or feature ideas?"
                    required
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    {feedback.length}/500 characters
                  </p>
                </div>

                {/* User Info Display (for logged-in users) */}
                {user && userProfile && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 mb-1">Sending as:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{userProfile.avatar_emoji || '👤'}</span>
                      <div>
                        <p className="text-sm font-medium text-blue-700">
                          {userProfile.username}
                        </p>
                        <p className="text-xs text-blue-600">
                          Score: {userProfile.score || 0} points
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  className={`btn-primary w-full py-3 flex items-center justify-center ${
                    isSubmitting || !feedback.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                      Send Feedback
                    </div>
                  )}
                </button>
              </form>

              {/* Footer */}
              <p className="text-xs text-center text-blue-600 mt-4">
                Your feedback helps make CagE better for everyone! 🚀
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
