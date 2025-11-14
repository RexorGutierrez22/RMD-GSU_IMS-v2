import React from 'react';

const Header = ({ title = 'Resource Management Division', subtitle = 'Inventory Management System', rightContent = null, onTitleClick = null }) => {
  return (
    <header className="relative z-20 shadow-lg" style={{ backgroundColor: '#760000', height: '100px' }}>
      <div className="w-full h-full px-6">
        <div className="flex items-center h-full">
          {/* University Header Image */}
          <div 
            className={`flex items-center h-full ${
              onTitleClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
            }`}
            onClick={onTitleClick}
          >
            <img 
              src="/usep-logo-name-v5.jpg" 
              alt="University of Southeastern Philippines" 
              className="h-20 object-contain"
            />
          </div>
          
          {/* Right Content - Dynamic Title and Subtitle */}
          <div className="flex items-center flex-shrink-0 ml-auto">
            <div className="text-right text-white" style={{ fontFamily: 'CustomHeader, sans-serif' }}>
              <h2 className="text-lg font-bold leading-tight">{title}</h2>
              <p className="text-sm text-red-100 font-medium">{subtitle}</p>
            </div>
            {rightContent}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
