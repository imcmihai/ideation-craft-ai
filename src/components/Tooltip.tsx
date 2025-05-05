import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1',
    left: 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-1',
    right: 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-1',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded shadow-sm whitespace-nowrap ${positionClasses[position]}`}
        >
          {content}
          <div 
            className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 ${
              position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
              position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
              position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' :
              'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
}; 