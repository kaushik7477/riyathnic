import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, ShieldCheck, Truck, RefreshCw, ChevronRight } from 'lucide-react';

const AboutUs: React.FC = () => {
  return (
    <div className="bg-white min-h-screen text-zinc-900 pt-24 pb-20 font-heading">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#03401b]">About Riyathnic</h1>
            <div className="h-1 w-24 bg-pink mx-auto rounded-full"></div>
          </div>

          <div className="space-y-8 text-lg md:text-xl leading-relaxed text-zinc-600 font-medium">
            <p>
              Welcome to <span className="text-[#03401b] font-black italic">Riyathnic</span>, where tradition meets contemporary elegance. We believe that fashion is more than just clothing—it's an expression of your heritage, grace, and confident individuality.
            </p>

            <p>
              Riyathnic is born from a shared passion to celebrate women's fashion, creating stylish, comfortable, and high-quality ethnic and modern wear that empowers individuals to express their own unique identity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12">
              <div className="bg-zinc-50 p-8 rounded-3xl border border-[#03401b]/10 space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#d3ebda] rounded-2xl flex items-center justify-center text-[#03401b]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase text-[#03401b]">Curated Collection</h3>
                <p className="text-sm text-zinc-500">
                  We offer a curated collection of premium women's apparel, featuring exquisite kurtis, elegant suit sets, beautiful dresses, modern co-ord sets, stylish tops, and graceful sarees.
                </p>
              </div>

              <div className="bg-zinc-50 p-8 rounded-3xl border border-[#03401b]/10 space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#d3ebda] rounded-2xl flex items-center justify-center text-[#03401b]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase text-[#03401b]">Premium Quality</h3>
                <p className="text-sm text-zinc-500">
                  Every piece is crafted with careful precision, using high-quality fabrics to ensure durability and comfort to give a seamless experience where your attire feels like your second skin.
                </p>
              </div>
            </div>

            <p>
              Our designs blend contemporary trends with timeless appeal, giving the aura of luxury for those who value both style and substance. We are a brand proudly <span className="text-[#03401b] font-black italic underline decoration-pink underline-offset-4">MADE IN INDIA</span> who believe that fashion should be inclusive, beautiful, and accessible to all.
            </p>

            <p className="text-2xl md:text-3xl font-black text-[#03401b] italic text-center py-12 border-y border-[#03401b]/10">
              "Elevating premium ethnic wear with modern elegance."
            </p>

            <p className="text-center pt-8 text-[#03401b] font-bold">
              Explore our ensemble today to find the perfect piece that resonates with your Look.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
