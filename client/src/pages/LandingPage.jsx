import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header.jsx';
import BorrowRequest from '../components/BorrowRequestQR.jsx';
import ReturnItem from '../components/ReturnItem.jsx';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showBorrowRequest, setShowBorrowRequest] = useState(false);
  const [showReturnItem, setShowReturnItem] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [typedLine1, setTypedLine1] = useState('');
  const [typedLine2, setTypedLine2] = useState('');
  const [showCursor1, setShowCursor1] = useState(true);
  const [showCursor2, setShowCursor2] = useState(false);

  // Background images for slideshow
  const backgrounds = [
    '/eagle.jpg',
    '/RMD-Homepage-v3.jpg'
  ];

  // Inspiring quotes for the slideshow
  const quotes = [
    "Responsibility begins with trust, and trust begins with you.",
    "Great ideas start with the right tools. Borrow what you need, build what you dream.",
    "Borrow with purpose. Return with pride. Together, we make our university resources go further.",
    "A campus that shares grows together. Borrow smart, use wisely, return responsibly.",
    "Shared tools. Shared trust. Shared success."
  ];

  // Typing effect for "Good Day" and "USePians!" on two lines
  useEffect(() => {
    const line1Text = "Good Day";
    const line2Text = "USePians!";
    let line1Index = 0;
    let line2Index = 0;
    let typingInterval2;

    // Add initial delay before starting to type
    const startDelay = setTimeout(() => {
      // Type first line
      const typingInterval1 = setInterval(() => {
        if (line1Index < line1Text.length) {
          line1Index++;
          setTypedLine1(line1Text.slice(0, line1Index));
        } else {
          clearInterval(typingInterval1);
          setShowCursor1(false);

          // Small pause before starting second line
          setTimeout(() => {
            setShowCursor2(true);

            // Start typing second line after first line completes
            typingInterval2 = setInterval(() => {
              if (line2Index < line2Text.length) {
                line2Index++;
                setTypedLine2(line2Text.slice(0, line2Index));
              } else {
                clearInterval(typingInterval2);
              }
            }, 100);
          }, 200);
        }
      }, 100);
    }, 1200); // Wait 1.2 seconds before starting typing

    return () => {
      clearTimeout(startDelay);
      if (typingInterval2) clearInterval(typingInterval2);
    };
  }, []);

  // Auto-rotate quotes every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  // Auto-rotate backgrounds every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [backgrounds.length]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Slideshow - Full Screen */}
      <div className="absolute inset-0 z-0">
        {backgrounds.map((bg, index) => (
          <motion.div
            key={bg}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: index === currentBgIndex ? 1 : 0,
              scale: index === currentBgIndex ? 1 : 1.1
            }}
            transition={{
              opacity: { duration: 1.5, ease: "easeInOut" },
              scale: { duration: 1.5, ease: "easeOut" }
            }}
            style={{
              backgroundImage: `url("${bg}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ))}
      </div>

      {/* Elegant Gradient Overlay - Modern 2025 Style */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-gray-800/60 z-[1]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      ></motion.div>

      {/* Subtle Animated Accent Orbs */}
      <div className="absolute inset-0 z-[2] overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/4 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Global Header */}
      <Header
        title="Resource Management Division"
        subtitle="Inventory Management System"
        onTitleClick={() => navigate('/admin')}
      />

      {/* Modern Content Section with Premium Layout */}
      <main className="flex-1 z-10 flex items-center justify-center px-6 md:px-12 lg:px-20 py-12">
        <motion.div
          className="max-w-4xl w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        >
          {/* Premium Glassmorphism Card - Center Aligned with More Transparency */}
          <motion.div
            className="mb-16 backdrop-blur-sm bg-white/[0.02] rounded-[2.5rem] p-10 border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Quote Slideshow */}
            <div className="relative min-h-[160px] mb-8">
              {quotes.map((quote, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    index === currentQuoteIndex
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: -20 }
                  }
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative w-full text-center">
                    <motion.div
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-7xl text-red-400/15 font-serif leading-none select-none"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: index === currentQuoteIndex ? 0.15 : 0,
                        scale: index === currentQuoteIndex ? 1 : 0.8
                      }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      "
                    </motion.div>

                    <p className="text-2xl sm:text-3xl lg:text-4xl font-light leading-relaxed tracking-wide px-6 text-white/90">
                      {quote}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Sleek Progress Dots - Centered */}
            <div className="flex gap-3 justify-center mt-12">
              {quotes.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentQuoteIndex(index)}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  className={`transition-all duration-500 rounded-full ${
                    index === currentQuoteIndex
                      ? 'w-10 h-2 bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                      : 'w-2 h-2 bg-white/25 hover:bg-white/40'
                  }`}
                  aria-label={`Go to quote ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Hero Section - Center Aligned */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <div className="mb-6">
              {/* First Line: Good Day */}
              <div className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-gray-50 to-white bg-clip-text text-transparent drop-shadow-2xl min-h-[4rem] sm:min-h-[5rem] lg:min-h-[6rem]">
                {typedLine1}
                {showCursor1 && (
                  <motion.span
                    className="inline-block w-1 h-16 sm:h-20 lg:h-24 bg-white ml-2"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Second Line: USePians! */}
              <div className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-gray-50 to-white bg-clip-text text-transparent drop-shadow-2xl mt-2 min-h-[4rem] sm:min-h-[5rem] lg:min-h-[6rem]">
                {typedLine2}
                {showCursor2 && (
                  <motion.span
                    className="inline-block w-1 h-16 sm:h-20 lg:h-24 bg-white ml-2"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>
            </div>

            <motion.p
              className="text-xl sm:text-2xl lg:text-3xl font-light text-white/85"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              How may I <span className="text-red-300 font-medium">assist</span> you today?
            </motion.p>
          </motion.div>

          {/* Premium Action Buttons - Center Aligned with Equal Width */}
          <motion.div
            className="flex flex-col sm:flex-row gap-5 justify-center items-stretch max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7 }}
          >
            <motion.button
              className="group relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-red-600/95 to-red-800/95 hover:from-red-500 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-2xl border border-red-400/20 transition-all duration-300 flex-1 sm:min-w-[200px]"
              onClick={() => setShowBorrowRequest(true)}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />

              <span className="relative z-10 flex items-center justify-center gap-2.5 text-base">
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ rotate: 5 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </motion.svg>
                Borrow/Request
              </span>
            </motion.button>

            <motion.button
              className="group relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-red-600/95 to-red-800/95 hover:from-red-500 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-2xl border border-red-400/20 transition-all duration-300 flex-1 sm:min-w-[200px]"
              onClick={() => setShowReturnItem(true)}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />

              <span className="relative z-10 flex items-center justify-center gap-2.5 text-base">
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ rotate: -5 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </motion.svg>
                Return an Item
              </span>
            </motion.button>

            <motion.button
              className="group relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-red-600/95 to-red-800/95 hover:from-red-500 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-2xl border border-red-400/20 transition-all duration-300 flex-1 sm:min-w-[200px]"
              onClick={() => navigate('/register')}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />

              <span className="relative z-10 flex items-center justify-center gap-2.5 text-base">
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ scale: 1.1 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </motion.svg>
                Register
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      </main>

      {/* Borrow Request Modal */}
      {showBorrowRequest && (
        <BorrowRequest onClose={() => setShowBorrowRequest(false)} />
      )}

      {/* Return Item Modal */}
      {showReturnItem && (
        <ReturnItem onClose={() => setShowReturnItem(false)} />
      )}
    </div>
  );
};

export default LandingPage;
