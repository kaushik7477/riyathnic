
import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldAlert, ShoppingBag, Info, RefreshCw, AlertTriangle } from 'lucide-react';

const TermsOfService: React.FC = () => {
  const sections = [
    {
      id: "section-1",
      title: "Section-1 Online Store Terms",
      icon: <ShoppingBag className="w-5 h-5 text-[#03401b]" />,
      content: "You have to be a major to agree to the terms and conditions. With your consent, dependents can also use the website. Our products cannot be used illegally or for unauthorized purposes. Our services cannot be used to violate the laws in your jurisdiction. Any type of destructive virus, worm or code cannot be transmitted by you. Violation or breach of any of the terms and conditions may lead to termination of your services."
    },
    {
      id: "section-2",
      title: "Section-2 General Conditions",
      icon: <Scale className="w-5 h-5 text-[#03401b]" />,
      content: "Without prior permission, you cannot duplicate, sell, copy or resell any information on the website. We reserve the rules to deny service to anyone at any time for any reason."
    },
    {
      id: "section-3",
      title: "Section-3 Accuracy, Completeness and Timeliness Of Information",
      icon: <Info className="w-5 h-5 text-[#03401b]" />,
      content: "If the information provided on the website is not accurate we are not responsible. It is always better to re-confirm the information and then take decisions to avoid risks."
    },
    {
      id: "section-4",
      title: "Section 4 - Modifications To The Service And Prices",
      icon: <RefreshCw className="w-5 h-5 text-[#03401b]" />,
      content: "The price of the products or services can change without any prior notice. We are not liable to you or any other third party for a change in price or suspension of services."
    },
    {
      id: "section-5",
      title: "Section 5-Products Or Services",
      icon: <AlertTriangle className="w-5 h-5 text-[#03401b]" />,
      content: "The products and services may have limited quantities subject to the stock available. The display on the website may not accurately display the product colour. Return or exchange is subjected to our return or exchange policy. We do not give a warranty that our products, services and information can meet your expectations."
    }
  ];

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
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Terms of Service</h1>
            <div className="h-1 w-24 bg-[#03401b] rounded-full"></div>
          </div>

          <div className="space-y-8 text-zinc-600">
            <section className="bg-zinc-50 p-8 rounded-3xl border border-[#03401b]/10 space-y-6">
              <p className="text-lg leading-relaxed">
                Soul Stich operates this website. The terms <span className="text-[#03401b] font-bold italic">we, us and our</span>, refers to Soul Stich. The information on the website, tools and services is for the users.
              </p>
              <p className="text-sm leading-relaxed uppercase tracking-widest font-bold">
                Browsing through the website means the user has accepted the terms, conditions, notices and policies of the website. Visiting or purchasing from the website means you are bound to the terms and conditions. The terms apply to all the vendors, browsers, merchants, content contributors and customers.
              </p>
              <p className="text-sm text-zinc-500 italic">
                We have hosted our store on <span className="text-zinc-600">Nushop.store</span>.
              </p>
            </section>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div 
                  key={section.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-zinc-50 p-8 rounded-3xl border border-[#03401b]/10 space-y-4 hover:border-[#03401b]/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <h2 className="text-xl font-black uppercase italic tracking-tight">{section.title}</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 font-medium">
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>

            <section className="bg-zinc-50 p-8 rounded-3xl border border-red-500/10 space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-black uppercase italic">Important Notice</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Please go through the terms and conditions mentioned on the website. If you do not agree to the conditions then do not access the website or use the services. The tools or features added to the website are also subject to terms and conditions. We reserve the right to replace or change the terms of service by posting updates on the website.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
