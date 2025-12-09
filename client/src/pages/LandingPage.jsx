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

  // Background images for slideshow with individual settings
  const backgrounds = [
    {
      url: '/eagle.jpg',
      position: 'center',
      size: 'cover'
    },
    {
      url: '/RMD-Homepage-v3.jpg',
      position: 'center',
      size: 'cover' // 1874x600 - very wide, short image
    },
    {
      url: '/RMD-Homepage-v5.jpg',
      position: 'center center',
      size: 'cover', // 5712x3213 - much taller than v3, will crop sides to fit viewport
      // Since v4 is portrait-oriented (taller), 'cover' will show center portion
      // If you want to see top/bottom, use position: 'top center' or 'bottom center'
    },
    {
      url: '/RMD-Homepage-v6.jpg',
      position: 'center center',
      size: 'cover', // 5712x3213 - much taller than v3, will crop sides to fit viewport
      // Since v4 is portrait-oriented (taller), 'cover' will show center portion
      // If you want to see top/bottom, use position: 'top center' or 'bottom center'
    },
    {
      url: '/RMD-Homepage-v7.jpg',
      position: 'center center',
      size: 'cover', // 5712x3213 - much taller than v3, will crop sides to fit viewport
      // Since v4 is portrait-oriented (taller), 'cover' will show center portion
      // If you want to see top/bottom, use position: 'top center' or 'bottom center'
    }
  ];

  // Inspiring quotes for the slideshow
  const quotes = [
    "Responsibility begins with trust, and trust begins with you.",
    "Great ideas start with the right tools. Borrow what you need, build what you dream.",
    "Borrow with purpose. Return with pride. Together, we make our university resources go further.",
    "A campus that shares grows together. Borrow smart, use wisely, return responsibly.",
    "Shared tools. Shared trust. Shared success."
  ];

  // Continuous typing effect for "Good Day" and "USePians!" on two lines
  // Sequential: Type line1 completely → Then type line2 → Wait → Backspace line2 → Then backspace line1 → Repeat
  useEffect(() => {
    const line1Text = "Good Day";
    const line2Text = "USePians!";

    let typingInterval1 = null;
    let typingInterval2 = null;
    let backspaceInterval1 = null;
    let backspaceInterval2 = null;
    let waitTimeout = null;
    let backspaceWaitTimeout = null;
    let line2StartTimeout = null;
    let line1BackspaceTimeout = null;
    let initialDelay = null;

    let isTyping = false;
    let isBackspacing = false;
    let isActive = true;

    const clearAll = () => {
      if (typingInterval1) { clearInterval(typingInterval1); typingInterval1 = null; }
      if (typingInterval2) { clearInterval(typingInterval2); typingInterval2 = null; }
      if (backspaceInterval1) { clearInterval(backspaceInterval1); backspaceInterval1 = null; }
      if (backspaceInterval2) { clearInterval(backspaceInterval2); backspaceInterval2 = null; }
      if (waitTimeout) { clearTimeout(waitTimeout); waitTimeout = null; }
      if (backspaceWaitTimeout) { clearTimeout(backspaceWaitTimeout); backspaceWaitTimeout = null; }
      if (line2StartTimeout) { clearTimeout(line2StartTimeout); line2StartTimeout = null; }
      if (line1BackspaceTimeout) { clearTimeout(line1BackspaceTimeout); line1BackspaceTimeout = null; }
    };

    const startTypingAnimation = () => {
      if (!isActive || isTyping || isBackspacing) return;

      clearAll();
      isTyping = true;
      isBackspacing = false;

      let line1Index = 0;
      let line2Index = 0;

      // Reset states
      setTypedLine1('');
      setTypedLine2('');
      setShowCursor1(true);
      setShowCursor2(false);

      // STEP 1: Type first line "Good Day" completely
      typingInterval1 = setInterval(() => {
        if (!isActive) {
          clearAll();
          return;
        }

        if (line1Index < line1Text.length) {
          line1Index++;
          setTypedLine1(line1Text.slice(0, line1Index));
        } else {
          // First line complete - stop cursor, clear interval
          clearInterval(typingInterval1);
          typingInterval1 = null;
          setShowCursor1(false);

          // Small pause (200ms) before starting second line
          line2StartTimeout = setTimeout(() => {
            if (!isActive) return;

            // STEP 2: Now start typing second line "USePians!"
            setShowCursor2(true);

            typingInterval2 = setInterval(() => {
              if (!isActive) {
                clearAll();
                return;
              }

              if (line2Index < line2Text.length) {
                line2Index++;
                setTypedLine2(line2Text.slice(0, line2Index));
              } else {
                // Both lines complete
                clearInterval(typingInterval2);
                typingInterval2 = null;
                setShowCursor2(false);
                isTyping = false;

                // Wait 10 seconds after both lines are typed
                waitTimeout = setTimeout(() => {
                  if (isActive) {
                    startBackspaceAnimation();
                  }
                }, 10000);
              }
            }, 100);
          }, 200);
        }
      }, 100);
    };

    const startBackspaceAnimation = () => {
      if (!isActive || isTyping || isBackspacing) return;

      clearAll();
      isBackspacing = true;
      isTyping = false;

      let line2Index = line2Text.length; // Start from end of "USePians!"
      let line1Index = line1Text.length;  // Will start after line2 is done

      // STEP 1: Backspace second line "USePians!" first
      setShowCursor2(true);

      backspaceInterval2 = setInterval(() => {
        if (!isActive) {
          clearAll();
          return;
        }

        if (line2Index > 0) {
          line2Index--;
          setTypedLine2(line2Text.slice(0, line2Index));
        } else {
          // Second line completely backspaced
          clearInterval(backspaceInterval2);
          backspaceInterval2 = null;
          setShowCursor2(false);

          // Small pause (200ms) before backspacing first line
          line1BackspaceTimeout = setTimeout(() => {
            if (!isActive) return;

            // STEP 2: Now backspace first line "Good Day"
            setShowCursor1(true);

            backspaceInterval1 = setInterval(() => {
              if (!isActive) {
                clearAll();
                return;
              }

              if (line1Index > 0) {
                line1Index--;
                setTypedLine1(line1Text.slice(0, line1Index));
              } else {
                // Both lines completely backspaced
                clearInterval(backspaceInterval1);
                backspaceInterval1 = null;
                setShowCursor1(false);
                isBackspacing = false;

                // Wait 1.5 seconds before starting typing again
                backspaceWaitTimeout = setTimeout(() => {
                  if (isActive) {
                    startTypingAnimation();
                  }
                }, 1500);
              }
            }, 80); // Slightly faster backspace
          }, 200);
        }
      }, 80); // Slightly faster backspace
    };

    // Initial delay before starting first typing animation
    initialDelay = setTimeout(() => {
      if (isActive) {
        startTypingAnimation();
      }
    }, 1200);

    return () => {
      isActive = false;
      if (initialDelay) clearTimeout(initialDelay);
      clearAll();
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
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Slideshow - Full Screen */}
      <div className="absolute inset-0 z-0">
        {backgrounds.map((bg, index) => (
          <motion.div
            key={bg.url}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: index === currentBgIndex ? 1 : 0,
              scale: index === currentBgIndex ? 1 : 1.05 // Reduced from 1.1 to minimize visual issues
            }}
            transition={{
              opacity: { duration: 1.5, ease: "easeInOut" },
              scale: { duration: 1.5, ease: "easeOut" }
            }}
            style={{
              backgroundImage: `url("${bg.url}")`,
              backgroundSize: bg.size || 'cover',
              backgroundPosition: bg.position || 'center',
              backgroundRepeat: 'no-repeat',
              ...(bg.backgroundColor && { backgroundColor: bg.backgroundColor }), // Only add backgroundColor if specified
            }}
          />
        ))}
      </div>

      {/* Elegant Gradient Overlay - Modern 2025 Style */}
      {/* Reduce overlay opacity for v4 image (index 2) to show the group photo better */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br z-[1] ${
          currentBgIndex === 2
            ? 'from-gray-900/50 via-gray-900/40 to-gray-800/30' // Lighter overlay for v4
            : 'from-gray-900/90 via-gray-900/70 to-gray-800/60'  // Original dark overlay for others
        }`}
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
      <main className="flex-1 z-10 flex flex-col items-center justify-center px-6 md:px-12 lg:px-20 py-12">
        {/* Pure Quote Text - No Background Card - Positioned at Top */}
        <motion.div
          className="mb-8 -mt-32 md:-mt-48 w-full max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
            {/* Quote Slideshow */}
            <div className="relative min-h-[140px] mb-6">
              {quotes.map((quote, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={
                    index === currentQuoteIndex
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.95 }
                  }
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-light italic leading-relaxed tracking-wide px-4 md:px-6 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center">
                    {quote}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Elegant Progress Line with Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {quotes.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentQuoteIndex(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative group"
                  aria-label={`Go to quote ${index + 1}`}
                >
                  {/* Connecting Line */}
                  {index < quotes.length - 1 && (
                    <div className={`absolute left-full top-1/2 -translate-y-1/2 h-[1px] w-6 ${
                      index < currentQuoteIndex
                        ? 'bg-red-500'
                        : 'bg-white/20'
                    } transition-colors duration-500`} />
                  )}

                  {/* Dot */}
                  <motion.div
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      index === currentQuoteIndex
                        ? 'bg-red-500 shadow-lg shadow-red-500/50'
                        : 'bg-white/40 group-hover:bg-white/60'
                    }`}
                    animate={{
                      scale: index === currentQuoteIndex ? 1.5 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              ))}
            </div>
        </motion.div>

        <motion.div
          className="max-w-4xl w-full mt-16 md:mt-24"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        >
          {/* Hero Section - Center Aligned - Moved Downward */}
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

      {/* Footer - Transparent, Floating on Sliding Images */}
      <footer className="relative z-10 w-full pb-2 -mt-32" style={{ backgroundColor: 'transparent' }}>
        <div className="max-w-7xl mx-auto px-6" style={{ backgroundColor: 'transparent' }}>
          {/* Horizontal Line Separator */}
          <div className="w-full h-px bg-gray-300/40 mb-3"></div>

          {/* Footer Content - Centered */}
          <div className="flex flex-col items-center" style={{ backgroundColor: 'transparent' }}>
            {/* Two Circular Logos Side by Side with Decorative Lines */}
            <div className="flex items-center justify-center gap-4 mb-2">
              {/* Decorative Line Before */}
              <div className="h-[0.8px] w-48 bg-gray-300/60"></div>

              {/* Logos Container */}
              <div className="flex items-center justify-center gap-3">
                {/* USeP Logo */}
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                  <img
                    src="/Usep_logo.png"
                    alt="University of Southeastern Philippines"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* RMD Logo */}
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                  <img
                    src="/RMD.png"
                    alt="Resource Data Management"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              {/* Decorative Line After */}
              <div className="h-[0.8px] w-48 bg-gray-300/60"></div>
            </div>

            {/* First Line: Organization Text - Single Line */}
            <p className="text-white/90 text-sm font-medium text-center whitespace-nowrap mb-0.5" style={{ backgroundColor: 'transparent' }}>
              University of Southeastern Philippines | Resource Management Division
            </p>

            {/* Second Line: Developer Team Link */}
            <motion.button
              onClick={() => navigate('/our-team')}
              className="text-white hover:text-white/90 text-sm font-semibold transition-colors duration-300 underline underline-offset-2 decoration-white/80 hover:decoration-white"
              style={{ backgroundColor: 'transparent' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Developer Team
            </motion.button>
          </div>
        </div>
      </footer>

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
