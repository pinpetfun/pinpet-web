import React from 'react';
import { HeroSection, HotProjectsSection, FilterBar, FeaturedTokens } from '../home';
// 暂时注释掉测试组件
// import { SdkTestComponent } from '../common';

const HomePage = () => {
  return (
    <main className="px-8 py-12 relative overflow-hidden">
      <HeroSection />
      {/* 暂时注释掉测试组件 */}
      {/* <SdkTestComponent /> */}
      <HotProjectsSection />
      <FilterBar />
      <FeaturedTokens />
    </main>
  );
};

export default HomePage;