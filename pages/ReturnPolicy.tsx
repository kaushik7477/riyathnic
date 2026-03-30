
import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Ban, CreditCard, AlertCircle, Package, Truck } from 'lucide-react';

const ReturnPolicy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen text-[#03401b] pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-[#03401b]">Return & Refund Policy</h1>
            <div className="h-1 w-24 bg-[#03401b] rounded-full"></div>
          </div>

          <div className="space-y-12">
            {/* Cancellation Policy */}
            <section className="space-y-6 bg-zinc-50 p-8 rounded-3xl border border-[#03401b]/10">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
                <Ban className="text-red-500" />
                Cancellation Policy
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed font-bold uppercase tracking-wider">
                In case there is an order cancellation, please do so before it is shipped. Once the product is shipped, it cannot be cancelled using our website.
              </p>
            </section>

            {/* Return Policy */}
            <section className="space-y-8">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
                <RefreshCw className="text-[#03401b]" />
                Return Policy
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    icon: <Package className="w-5 h-5" />,
                    text: "Return/Exchange is available for selected products only. Information is available on the product page. Policy can change without prior notice."
                  },
                  {
                    icon: <Truck className="w-5 h-5" />,
                    text: "If pick-up service is unavailable at your location, you would have to self-ship the product to our office Address."
                  },
                  {
                    icon: <CreditCard className="w-5 h-5" />,
                    text: "Return/Exchange charges may apply on a case-to-case basis."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 bg-zinc-50 rounded-2xl border border-[#03401b]/10">
                    <div className="text-[#03401b] flex-shrink-0">{item.icon}</div>
                    <p className="text-xs font-bold uppercase tracking-widest leading-relaxed text-zinc-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Refund Policy */}
            <section className="space-y-6 bg-zinc-50 p-8 rounded-3xl border border-[#03401b]/10">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
                <CreditCard className="text-[#03401b]" />
                Refund Policy
              </h2>
              <div className="space-y-4 text-sm text-zinc-600 leading-relaxed">
                <p>We accept the refund request if there is a mismatch in quality, size, color or design or in case an item is missing/wrong/damage in a combo order.</p>
                <p className="bg-[#03401b]/10 p-4 rounded-xl border border-[#03401b]/20 text-[#03401b] font-bold italic">
                  Once the product has been picked up, the Refund is processed on the next 5-7 working days with the same transaction mode.
                </p>
              </div>
            </section>

            {/* Note for Return */}
            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase italic flex items-center gap-3 text-red-500">
                <AlertCircle />
                Important Notes for Return
              </h2>
              <div className="bg-zinc-50 p-8 rounded-3xl border border-red-500/10 space-y-4">
                <ul className="space-y-4">
                  {[
                    "Items should be unused and unwashed for hygiene reasons.",
                    "Product should have the original packaging and tags in place.",
                    "Items without the original tags will not be accepted.",
                    "Customized products cannot be returned or exchanged.",
                    "Requests not raised within the return period will not be accepted."
                  ].map((note, i) => (
                    <li key={i} className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
