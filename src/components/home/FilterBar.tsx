import React from 'react';
import { Button, Menu } from '@headlessui/react';
import { 
  MagnifyingGlassIcon, 
  FireIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  Squares2X2Icon,
  ListBulletIcon,
  RectangleGroupIcon,
  ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline';

const FilterBar = () => {
  return (
    <div className="relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center bg-white border-2 border-black rounded-lg p-2 w-full md:w-auto mb-4 md:mb-0 cartoon-shadow-sm">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
          <input 
            className="bg-transparent text-black placeholder-gray-500 focus:outline-none ml-2 font-nunito" 
            placeholder="Search tokens..." 
            type="text"
          />
        </div>
        
        <div className="flex items-center space-x-2 flex-wrap justify-center">
          <span className="text-gray-700 font-nunito text-lg">Filter:</span>
          
          <Button className="btn-cartoon bg-pink-400 hover:bg-pink-500 flex items-center">
            <FireIcon className="h-4 w-4 mr-1" />
            Hottest
          </Button>
          
          <Button className="btn-cartoon flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            Created
          </Button>
          
          <Button className="btn-cartoon flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            Ascending
          </Button>
          
          <Menu as="div" className="relative">
            <Menu.Button className="btn-cartoon flex items-center">
              <Squares2X2Icon className="h-4 w-4 mr-1" />
              View
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-40 bg-white border-2 border-black rounded-lg cartoon-shadow-sm z-50">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-yellow-400' : ''
                    } w-full text-left px-4 py-2 font-nunito text-sm first:rounded-t-lg hover:bg-yellow-400 transition-colors flex items-center`}
                  >
                    <Squares2X2Icon className="h-4 w-4 mr-2" />
                    Grid View
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-yellow-400' : ''
                    } w-full text-left px-4 py-2 font-nunito text-sm hover:bg-yellow-400 transition-colors flex items-center`}
                  >
                    <ListBulletIcon className="h-4 w-4 mr-2" />
                    List View
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-yellow-400' : ''
                    } w-full text-left px-4 py-2 font-nunito text-sm last:rounded-b-lg hover:bg-yellow-400 transition-colors flex items-center`}
                  >
                    <RectangleGroupIcon className="h-4 w-4 mr-2" />
                    Card View
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
        
        <Button className="text-gray-700 hover:text-orange-500 flex items-center mt-4 md:mt-0 font-nunito">
          <HistoryIcon className="h-4 w-4 mr-1" />
          All Tokens
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;