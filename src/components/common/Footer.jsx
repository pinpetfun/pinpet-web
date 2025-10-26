import React from 'react';
const Footer = () => {
  return (
    <footer className="bg-amber-100 border-t-4 border-black mt-16">
      <div className="px-8 py-8">
        {/* Social Links */}
        <div className="flex justify-center space-x-4 mb-6">
          <a
            href="https://doc.pinpet.fun/#/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border-2 border-black rounded-lg p-3 cartoon-shadow-sm hover:bg-blue-100 transition-colors group"
          >
            <svg className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </a>
          
          <a
            href="https://github.com/pinpetfun"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border-2 border-black rounded-lg p-3 cartoon-shadow-sm hover:bg-gray-100 transition-colors group"
          >
            <svg className="w-6 h-6 text-gray-800 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          
          <a
            href="https://twitter.com/pinpet"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border-2 border-black rounded-lg p-3 cartoon-shadow-sm hover:bg-blue-50 transition-colors group"
          >
            <svg className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
          
          <a
            href="https://discord.gg/pinpet"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border-2 border-black rounded-lg p-3 cartoon-shadow-sm hover:bg-purple-50 transition-colors group"
          >
            <svg className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>
        </div>

        {/* Footer Text */}
        <div className="border-t-2 border-black pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mb-4 md:mb-0">
              <span className="text-gray-600 font-nunito">© 2025 PinPet. All rights reserved.</span>
              <span className="hidden md:inline text-gray-500">|</span>
              <span className="text-gray-600 font-nunito">Made with ❤️ for pet lovers</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="/privacy" className="text-gray-600 hover:text-orange-500 transition-colors font-nunito">Privacy</a>
              <span className="text-gray-500">|</span>
              <a href="/cookies" className="text-gray-600 hover:text-orange-500 transition-colors font-nunito">Cookies</a>
              <span className="text-gray-500">|</span>
              <a href="/debug" className="text-xs text-gray-400 hover:text-orange-500 transition-colors font-nunito">Debug</a>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600 font-nunito">Built on <span className="text-orange-500 font-bold">Solana</span> ⚡</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;