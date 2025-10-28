import React from 'react';
import { getEmojiImage } from '../../config/emojiConfig';

const HeroSection = () => {
  return (
    <div className="relative z-10">
      {/* Background decorative images */}
      <img
        alt="cute pet"
        className="absolute -top-10 -left-10 w-48 opacity-80 rotate-[-15deg] z-0"
        src={getEmojiImage('cat', 200)}
      />
      <img
        alt="cute pet"
        className="absolute -bottom-16 -right-12 w-64 opacity-80 rotate-[20deg] z-0"
        src={getEmojiImage('dog', 250)}
      />
      
      <div className="text-center mb-16 relative z-10">
        <h1 className="text-7xl font-extrabold font-nunito text-orange-500 drop-shadow-[5px_5px_0px_rgba(0,0,0,1)] mb-4">
          PinPet
        </h1>
        <p className="text-2xl text-gray-700 font-nunito">Built for community, by community</p>
      </div>
    </div>
  );
};

export default HeroSection;