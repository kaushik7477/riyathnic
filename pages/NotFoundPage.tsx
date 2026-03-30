import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-[#03401b] font-heading relative overflow-hidden">
      
      {/* Decorative subtle background blobs for the Riyathnic aesthetic */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d3ebda] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse delay-700"></div>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center max-w-2xl"
        >
          {/* Big OOPS Text with Gradient Clip to mimic the cosmic effect but in brand colors */}
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
            className="text-[140px] md:text-[220px] leading-none font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#03401b] via-[#468057] to-pink animate-gradient-x select-none"
          >
            Oops!
          </motion.h1>

          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl font-black uppercase tracking-widest text-[#03401b] mb-4"
          >
            404 - PAGE NOT FOUND
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm md:text-base text-zinc-600 mb-10 max-w-md mx-auto font-medium leading-relaxed"
          >
            The page you are looking for might have been removed
            had its name changed or is temporarily unavailable.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link 
              to="/" 
              className="inline-block px-10 py-4 bg-[#03401b] text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              GO TO HOMEPAGE
            </Link>
          </motion.div>
        </motion.div>

        <style>{`
          @keyframes gradient-x {
            0%, 100% {
              background-size: 200% 200%;
              background-position: left center;
            }
            50% {
              background-size: 200% 200%;
              background-position: right center;
            }
          }
          .animate-gradient-x {
            animation: gradient-x 5s ease infinite;
          }
        `}</style>
      </main>
    </div>
  );
};

export default NotFoundPage;
