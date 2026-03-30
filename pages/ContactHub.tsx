import React from 'react';
import { Phone, MessageCircle, Mail, MapPin, Clock, ShieldCheck, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactHub: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 text-[#03401b] font-heading">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="flex items-center justify-between mb-10 md:mb-14">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Contact Hub</h1>
            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-600 mt-2">
              Reach the Soul Stich support core
            </p>
          </div>
          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-[#03401b]"
          >
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-8 md:gap-12">
          <div className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-zinc-100 shadow-md border border-zinc-200 rounded-2xl p-5 space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#03401b]/5 text-[#03401b]">
                  <Phone className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Call Support</p>
                <p className="text-sm font-bold text-[#03401b]">+91 - 6289388029</p>
                <p className="text-[11px] text-zinc-600">Mon–Sat, 11 AM – 6 PM (IST)</p>
                <a
                  href="tel:+916289388029"
                  className="inline-flex mt-2 text-[10px] font-black uppercase tracking-widest text-[#03401b] hover:text-[#03401b]"
                >
                  Tap to call
                </a>
              </div>

              <div className="bg-zinc-100 shadow-md border border-zinc-200 rounded-2xl p-5 space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#03401b]/5 text-[#03401b]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">WhatsApp Line</p>
                <p className="text-sm font-bold text-[#03401b]">+91 - 6289388029</p>
                <p className="text-[11px] text-zinc-600">For quick order queries and updates</p>
                <a
                  href="https://wa.me/916289388029"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-2 text-[10px] font-black uppercase tracking-widest text-[#03401b] hover:text-[#03401b]"
                >
                  Open WhatsApp
                </a>
              </div>

              <div className="bg-zinc-100 shadow-md border border-zinc-200 rounded-2xl p-5 space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#03401b]/5 text-[#03401b]">
                  <Mail className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Email Support</p>
                <p className="text-sm font-bold text-[#03401b] break-all">soulstich.store@gmail.com</p>
                <p className="text-[11px] text-zinc-600">For detailed issues, returns or collaborations</p>
                <a
                  href="mailto:soulstich.store@gmail.com"
                  className="inline-flex mt-2 text-[10px] font-black uppercase tracking-widest text-[#03401b] hover:text-[#03401b]"
                >
                  Write an email
                </a>
              </div>
            </div>

            <div className="bg-zinc-100 shadow-md border border-zinc-200 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Support Request</p>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter mt-1">
                    Share your concern
                  </h2>
                  <p className="text-[11px] md:text-xs text-zinc-600 mt-2 max-w-xl">
                    Drop your basic details and concern. Our team will reach out over WhatsApp or email within
                    working hours.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <ShieldCheck className="w-4 h-4 text-[#03401b]" />
                  <span className="font-bold uppercase tracking-widest">Secure & encrypted</span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thanks for reaching out. Our team will contact you shortly during support hours.');
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 text-[11px] md:text-xs"
              >
                <div className="space-y-1">
                  <label className="block font-bold uppercase tracking-widest text-zinc-600">Name</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-[#03401b]/10 rounded-lg px-3 py-2 text-xs text-[#03401b] outline-none focus:border-pink"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold uppercase tracking-widest text-zinc-600">Phone</label>
                  <input
                    type="tel"
                    className="w-full bg-white border border-[#03401b]/10 rounded-lg px-3 py-2 text-xs text-[#03401b] outline-none focus:border-pink"
                    placeholder="+91"
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="block font-bold uppercase tracking-widest text-zinc-600">Order ID (optional)</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-[#03401b]/10 rounded-lg px-3 py-2 text-xs text-[#03401b] outline-none focus:border-pink"
                    placeholder="SS5412369854"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="block font-bold uppercase tracking-widest text-zinc-600">Issue Type</label>
                  <select
                    className="w-full bg-white border border-[#03401b]/10 rounded-lg px-3 py-2 text-xs text-[#03401b] outline-none focus:border-pink"
                    defaultValue="order"
                  >
                    <option value="order">Order / Delivery</option>
                    <option value="size">Size / Fit</option>
                    <option value="return">Return / Exchange</option>
                    <option value="payment">Payment / Refund</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="block font-bold uppercase tracking-widest text-zinc-600">Describe your issue</label>
                  <textarea
                    className="w-full bg-white border border-[#03401b]/10 rounded-lg px-3 py-2 text-xs text-[#03401b] outline-none focus:border-pink h-28 md:h-32 resize-none"
                    placeholder="Share a brief description so we can help faster"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-3 mt-2">
                  <p className="text-[10px] text-zinc-600">
                    By submitting, you agree to be contacted over WhatsApp, SMS or email regarding your query.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[#03401b] !text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                  >
                    Submit request
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6 md:space-y-7">
            <div className="bg-zinc-100 shadow-md border border-zinc-200 rounded-3xl p-6 md:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Support Hours</p>
                <Clock className="w-4 h-4 text-zinc-600" />
              </div>
              <p className="text-lg font-black text-[#03401b]">Mon – Sat, 11 AM – 6 PM</p>
              <p className="text-[11px] text-zinc-600">
                Queries raised beyond these hours will be picked up on the next working day.
              </p>
            </div>

            <div className="bg-zinc-100 shadow-md border border-zinc-200 rounded-3xl p-6 md:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Store Address</p>
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xs font-bold text-zinc-700 leading-relaxed">
                Fortune township, 49/2, Jessore Road, Kajipara, Barasat, Kolkata - 700125, West Bengal, North 24
                Parganas, 700125
              </p>
            </div>

            <div className="bg-zinc-100 shadow-md border border-zinc-200 rounded-3xl p-6 md:p-7 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Social Channels</p>
              <p className="text-xs text-zinc-600">
                For drops, updates and behind-the-scenes from the Soul Stich lab.
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="p-2 rounded-xl bg-white border border-[#03401b]/10 text-zinc-600 hover:text-[#03401b] hover:border-pink"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-xl bg-white border border-[#03401b]/10 text-zinc-600 hover:text-[#03401b] hover:border-pink"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactHub;

