import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Linkedin, ArrowRight, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-zinc-900 font-heading overflow-hidden pt-16 md:pt-24 border-t border-zinc-100">
      <div className="container mx-auto px-6 lg:px-12">

        {/* Top Section: Logo & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-16 md:mb-24">

          {/* Logo & About */}
          <div className="lg:col-span-7 space-y-8">
            <Link to="/" className="inline-block group">
              <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-[#03401b] group-hover:text-pink transition-colors underline decoration-[#03401b]/10 decoration-4 underline-offset-8">RIYATHNIC.</h3>
            </Link>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed max-w-md font-medium">
              Elevating premium ethnic wear with modern elegance. Because your style shouldn't just be a choice, it should be a statement of your soul. Join our journey of timeless fashion.
            </p>
          </div>

          {/* Newsletter Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              {/* <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink block">Join the Sisterhood</span> */}
              <h2 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight">Drop your email for<br />exclusive drops.</h2>
            </div>
            <div className="relative max-w-md">
              <input
                type="email"
                placeholder="Enter your email..."
                className="w-full bg-zinc-100 text-black pl-6 pr-16 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-pink/30 transition-all font-bold text-sm border-none shadow-inner"
              />
              <button className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-[#03401b] text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-all group">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-12 border-t border-zinc-100 pt-16 md:pt-24 pb-8">

          {/* Link Groups */}
          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-[#03401b]">Resources</h4>
            <ul className="space-y-4 text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">
              <li><Link to="/about" className="hover:text-pink transition-colors">Why Riyathnic?</Link></li>
              <li><Link to="/contact-hub" className="hover:text-pink transition-colors">Customer Hub</Link></li>
              <li><Link to="/products" className="hover:text-pink transition-colors">Collection</Link></li>
              <li><Link to="/products" className="hover:text-pink transition-colors">New Drops</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-[#03401b]">Company</h4>
            <ul className="space-y-4 text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">
              <li><Link to="/about" className="hover:text-pink transition-colors">Our Story</Link></li>
              <li><Link to="/career" className="hover:text-pink transition-colors">Careers</Link></li>
              <li><Link to="/collab" className="hover:text-pink transition-colors">Collab With Us</Link></li>
              <li><Link to="/contact-hub" className="hover:text-pink transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-[#03401b]">Social</h4>
            <ul className="space-y-4 text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">
              <li><a href="#" className="hover:text-pink transition-colors flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</a></li>
              <li><a href="#" className="hover:text-pink transition-colors flex items-center gap-2"><Facebook className="w-4 h-4" /> Facebook</a></li>
              <li><a href="#" className="hover:text-pink transition-colors flex items-center gap-2"><Twitter className="w-4 h-4" /> Twitter</a></li>
              <li><a href="#" className="hover:text-pink transition-colors flex items-center gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</a></li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-[#03401b]">Legal Core</h4>
            <ul className="space-y-4 text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">
              <li><Link to="/privacy-policy" className="hover:text-pink transition-colors">Privacy Policy</Link></li>
              <li><Link to="/return-policy" className="hover:text-pink transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-pink transition-colors">Terms of Service</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-pink transition-colors">Shipping Policy</Link></li>
              <li><Link to="/contact-hub" className="hover:text-pink transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Illustration Section - Light themed background */}
        <div className="relative mt-4">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-zinc-50 py-8 border-t border-zinc-100 relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-black">
            <span>© 2026 RIYATHNIC APPAREL CO.</span>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="hover:opacity-70 transition-opacity">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:opacity-70 transition-opacity">Terms of Use</Link>
              <Link to="/return-policy" className="hover:opacity-70 transition-opacity">Returns & Refunds</Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
            <span className="text-black">Built with</span>
            <Heart className="w-3 h-3 text-pink fill-pink animate-pulse" />
            <span className="text-black">for the bold</span>
          </div>
        </div>

        {/* Developer Credit - Animated & Bold */}
        <div className="container mx-auto px-6 mt-10 pt-8 border-t border-zinc-200">
          <a
            href="https://mitelogix.in"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 hover:scale-105 transition-all duration-500"
          >
            <div className="flex items-center gap-3 animate-bounce-slow">
              <span className="text-[11px] md:text-xs uppercase tracking-[4px] text-[#03401b] font-black">
                Engineered with Excellence by
              </span>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[#03401b]/5 blur-2xl rounded-full group-hover:bg-[#03401b]/10 transition-colors"></div>
              <img
                src="/assets/mytelogix.png"
                alt="Mitelogix"
                className="h-16 md:h-20 w-auto object-contain relative z-10 drop-shadow-lg"
              />
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
