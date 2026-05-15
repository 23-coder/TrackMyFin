import React from 'react';
import TrackMyFinLogo from './TrackMyFinLogo';

const LogoShowcase: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-8 rounded-2xl">
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
        TrackMyFin Logo Showcase
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Hero Size */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Hero Size</h3>
          <div className="flex justify-center">
            <TrackMyFinLogo 
              size="hero" 
              showText={true} 
              animated={true}
              variant="default"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Perfect for landing pages</p>
        </div>

        {/* Large Size */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Large Size</h3>
          <div className="flex justify-center items-center h-24">
            <TrackMyFinLogo 
              size="large" 
              showText={true} 
              animated={true}
              variant="default"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Great for headers</p>
        </div>

        {/* Medium Size */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Medium Size</h3>
          <div className="flex justify-center items-center h-24">
            <TrackMyFinLogo 
              size="medium" 
              showText={true} 
              animated={true}
              variant="default"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Standard navigation</p>
        </div>

        {/* Small Size */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Small Size</h3>
          <div className="flex justify-center items-center h-24">
            <TrackMyFinLogo 
              size="small" 
              showText={true} 
              animated={true}
              variant="default"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Compact spaces</p>
        </div>

        {/* Minimal Variant */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Minimal Variant</h3>
          <div className="flex justify-center items-center h-24">
            <TrackMyFinLogo 
              size="large" 
              showText={true} 
              animated={true}
              variant="minimal"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Clean & simple</p>
        </div>

        {/* Icon Only */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Icon Only</h3>
          <div className="flex justify-center items-center h-24">
            <TrackMyFinLogo 
              size="large" 
              showText={false} 
              animated={true}
              variant="icon-only"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">App icons & favicons</p>
        </div>

      </div>

      {/* Color Variations */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
          Different Backgrounds
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* White Background */}
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h4 className="text-sm font-semibold mb-4 text-gray-600">White Background</h4>
            <div className="flex justify-center">
              <TrackMyFinLogo size="medium" showText={true} animated={false} />
            </div>
          </div>

          {/* Dark Background */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-center">
            <h4 className="text-sm font-semibold mb-4 text-gray-300">Dark Background</h4>
            <div className="flex justify-center">
              <TrackMyFinLogo size="medium" showText={true} animated={false} />
            </div>
          </div>

          {/* Blue Background */}
          <div className="bg-blue-600 p-6 rounded-xl shadow-lg text-center">
            <h4 className="text-sm font-semibold mb-4 text-white">Blue Background</h4>
            <div className="flex justify-center">
              <TrackMyFinLogo size="medium" showText={true} animated={false} />
            </div>
          </div>

          {/* Green Background */}
          <div className="bg-green-600 p-6 rounded-xl shadow-lg text-center">
            <h4 className="text-sm font-semibold mb-4 text-white">Green Background</h4>
            <div className="flex justify-center">
              <TrackMyFinLogo size="medium" showText={true} animated={false} />
            </div>
          </div>

        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center text-gray-700 dark:text-gray-300">
          Usage Examples
        </h3>
        
        <div className="space-y-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Navigation Bar:</h4>
            <code className="text-blue-600 dark:text-blue-400">
              {`<TrackMyFinLogo size="medium" showText={true} animated={true} />`}
            </code>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Hero Section:</h4>
            <code className="text-blue-600 dark:text-blue-400">
              {`<TrackMyFinLogo size="hero" showText={false} animated={true} />`}
            </code>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">App Icon:</h4>
            <code className="text-blue-600 dark:text-blue-400">
              {`<TrackMyFinLogo size="large" showText={false} variant="icon-only" />`}
            </code>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Minimal Design:</h4>
            <code className="text-blue-600 dark:text-blue-400">
              {`<TrackMyFinLogo size="medium" showText={true} variant="minimal" />`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoShowcase;