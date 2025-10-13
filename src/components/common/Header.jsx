import React from 'react';
import { Menu } from '@headlessui/react';
import { LanguageIcon } from '@heroicons/react/24/outline';
import WalletButton from './WalletButton.jsx'; // 导入钱包按钮组件

const Header = () => {
  return (
    <header className="bg-amber-100 py-4 px-8 flex justify-between items-center border-b-4 border-black">
      <div className="flex items-center space-x-2">
        <img 
          alt="SpinPet logo" 
          className="w-12 h-12" 
          src="https://via.placeholder.com/48x48/FFA500/FFFFFF?text=SP"
        />
        <span className="text-3xl font-fredoka text-orange-500">SpinPet</span>
      </div>
      
      <nav className="hidden md:flex items-center space-x-6 font-fredoka text-lg">
        <a className="text-gray-700 hover:text-orange-500 transition-colors" href="/">Home</a>
        <a className="text-gray-700 hover:text-orange-500 transition-colors" href="/create">Create</a>
        <a className="text-gray-700 hover:text-orange-500 transition-colors" href="/trending">Trending</a>
        <a className="text-gray-700 hover:text-orange-500 transition-colors" href="/resources">Resources</a>
        <a className="text-gray-700 hover:text-orange-500 transition-colors" href="/debug">Debug</a>
      </nav>
      
      <div className="flex items-center space-x-4">
        <WalletButton />
        
        <Menu as="div" className="relative">
          <Menu.Button className="btn-cartoon h-[44px] w-[44px] flex items-center justify-center">
            <LanguageIcon className="h-6 w-6" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-32 bg-white border-2 border-black rounded-lg cartoon-shadow-sm z-50">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-yellow-400' : ''
                  } w-full text-left px-4 py-2 font-fredoka text-sm first:rounded-t-lg last:rounded-b-lg hover:bg-yellow-400 transition-colors`}
                >
                  English
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-yellow-400' : ''
                  } w-full text-left px-4 py-2 font-fredoka text-sm first:rounded-t-lg last:rounded-b-lg hover:bg-yellow-400 transition-colors`}
                >
                  中文
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-yellow-400' : ''
                  } w-full text-left px-4 py-2 font-fredoka text-sm first:rounded-t-lg last:rounded-b-lg hover:bg-yellow-400 transition-colors`}
                >
                  Español
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>
    </header>
  );
};

export default Header;