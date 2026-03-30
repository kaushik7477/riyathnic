import React from 'react';

interface SectionHeadingProps {
  title: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ title }) => {
  return (
    <div className="relative flex items-center justify-center py-8 md:py-12 w-full max-w-[100vw] overflow-hidden">
      {/* Background Text */}
      <h2
        className="absolute text-5xl md:text-6xl lg:text-[5rem] text-slate-200/70 pointer-events-none whitespace-nowrap select-none flex items-center justify-center h-full italic"
        style={{ fontFamily: '"Judson", serif' }}
      >
        {title}
      </h2>

      {/* Foreground Text */}
      <h2
        className="relative text-xl md:text-2xl lg:text-[2.2rem] font-bold text-[#468057] tracking-wider z-10 mt-6 md:mt-8 lg:mt-12"
        style={{ fontFamily: '"Aboreto", sans-serif', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
      >
        {title}
      </h2>
    </div>
  );
};

export default SectionHeading;
