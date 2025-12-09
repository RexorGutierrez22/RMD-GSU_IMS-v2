import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';

const STORAGE_KEY = 'privacyModalClosed';

const RegisterPage = () => {
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  // Always start with modal showing - this ensures modal appears first
  const [showPrivacyModal, setShowPrivacyModal] = useState(true);

  // On mount, ensure modal shows - don't check sessionStorage immediately
  // This ensures modal always appears first when visiting /register
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Always show modal on mount - sessionStorage will only be checked
      // when user explicitly closes the modal
      console.log('RegisterPage mounted - showing privacy modal');
      setShowPrivacyModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Memoize the close handler to prevent re-renders
  const handleCloseModal = useCallback((e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Save to sessionStorage first
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Could not save to sessionStorage:', e);
    }

    // Then update state
    setShowPrivacyModal(false);
  }, []);

  // Memoize the modal JSX to prevent re-renders
  const modalContent = useMemo(() => {
    if (!showPrivacyModal) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-privacy-modal-fade-in relative"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleCloseModal}
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white rounded-full p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Content */}
          <div className="p-8">
            {/* Icon Section */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Shield Background */}
                <div className="w-24 h-24 bg-red-800 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                {/* Device Icons - Desktop */}
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center opacity-80 transform rotate-12">
                  <svg className="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                {/* Device Icons - Laptop */}
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-yellow-400 rounded flex items-center justify-center opacity-80 transform -rotate-12">
                  <svg className="w-4 h-4 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                {/* Device Icons - Mobile */}
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-yellow-400 rounded flex items-center justify-center opacity-80 transform translate-y-1/2">
                  <svg className="w-3.5 h-3.5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Data Privacy Statement
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                By continuing to browse this website, you agree to the{' '}
                <strong className="text-red-800">University of Southeastern Philippines</strong> Data Privacy Statement.
              </p>
              <p className="text-gray-600 text-sm mt-3">
                The full text of The Statement can be accessed through this{' '}
                <a
                  href="https://www.usep.edu.ph/usep-data-privacy-statement/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-800 hover:text-red-900 font-semibold underline transition-colors"
                >
                  link
                </a>
                .
              </p>
            </div>

            {/* Accept Button */}
            <button
              onClick={handleCloseModal}
              type="button"
              className="w-full bg-red-800 hover:bg-red-900 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              I Understand and Agree
            </button>
          </div>
        </div>
      </div>
    );
  }, [showPrivacyModal, handleCloseModal]);

  // Always render RegisterPage content, with modal overlay on top if showing
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Privacy Modal Overlay - shows on top of RegisterPage content */}
      {modalContent}
      {/* Background image full-screen via img ensures loading */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/Dashboard.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      ></div>

      {/* Optional overlay for readability */}
      <div className="absolute inset-0 bg-white opacity-60 z-0"></div>

      {/* Global Header with clickable branding */}
      <div className="relative z-20">
        <Header
          title="Resource Management Division"
          subtitle="Registration Portal"
          onTitleClick={() => navigate('/')}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 z-10 flex flex-col items-center justify-center text-center px-4 py-24">
        <h2 className="text-black text-2xl sm:text-3xl md:text-4xl font-semibold mb-8 mt-[-130px]">
        Are you a Student or Employee?
        </h2>
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-4">
          <button
            type="button"
            className="main-btn"
            onClick={() => navigate('/register/student')}
          >
            Student
          </button>
          <button
            type="button"
            className="main-btn"
            onClick={() => navigate('/register/employee')}
          >
            Employee
          </button>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
