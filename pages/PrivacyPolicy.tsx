import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-zinc-50 min-h-screen text-[#03401b] pt-24 pb-20 font-heading">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Privacy Policy</h1>
            <div className="h-1 w-24 bg-[#03401b] rounded-full"></div>
          </div>

          <div className="space-y-12 text-zinc-700">
            <section className="space-y-4 bg-white p-8 rounded-3xl shadow-sm border border-[#03401b]/10">
              <p className="text-lg leading-relaxed font-sans">
                Your personal information is always kept confidential. The privacy policy is displayed on the website. The type of info collected from the customers and usage of this information is published here. We have a policy of not disclosing any information to third parties. Using our website means you have agreed to the terms and conditions of the website. It applies to the people who have not got any transactions or who have got registered to the site and had business. Personal information is mainly used to locate or contact a person. Other information like name address, phone number, fax, credit card information, financial profiles, identification number and e-mail address are also available with us and are always confidential.
              </p>
            </section>

            <div className="grid grid-cols-1 gap-8 font-sans">
              <section className="space-y-6">
                <h2 className="text-2xl font-black uppercase italic flex items-center gap-3 text-[#03401b] font-heading">
                  <FileText className="text-[#03401b]" />
                  Terms Of Our Privacy Policy
                </h2>
                
                <div className="space-y-4">
                  <h3 className="text-[#03401b] font-bold uppercase text-sm tracking-widest font-heading">Personal Information That We collect</h3>
                  <p className="text-sm leading-relaxed">
                    Necessary information is collected for becoming a subscriber or member of our website. Our system collects the IP address of your computer automatically. But this detail does not give information about any particular person. But Riyathnic website doesn't collect information about children.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[#03401b] font-bold uppercase text-sm tracking-widest font-heading">Uses Of The Information Collected</h3>
                  <p className="text-sm leading-relaxed mb-4">All the personal information collected is kept confidential. The information may be used for:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Send news about the website",
                      "Calculate the number of visitors",
                      "Monitor the website",
                      "Know the geographical location",
                      "Contact with information",
                      "Better shopping experience",
                      "Update about recent offers"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider bg-white p-4 rounded-xl shadow-sm border border-[#03401b]/5 hover:border-[#03401b]/20 transition-colors">
                        <div className="w-2 h-2 bg-pink rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="space-y-6 border-t border-[#03401b]/10 pt-8">
                <p className="text-sm leading-relaxed italic border-l-4 border-pink pl-4">
                  Some of the personal information is shared with the courier companies like addresses/contact details. We have to give some information to vendors. This personal information helps Riyathnic to perform their duties and fulfil the order requirements. But private information cannot be accessed by unauthorised persons or organisations. 
                </p>
                
                <p className="text-sm leading-relaxed bg-zinc-100 p-6 rounded-2xl border border-[#03401b]/5 font-medium">
                  The Company will disclose your information, including, without limitation, your name, city, state, telephone number, email address, user ID history, quoting and listing history, and complaints, to law enforcement or other government officials if it is required to do so by law, regulation or other government authority or otherwise in cooperation with an investigation of governmental authority.
                </p>

                <div className="space-y-4">
                  <h3 className="text-[#03401b] font-bold uppercase text-sm tracking-widest flex items-center gap-2 font-heading">
                    <Eye className="w-5 h-5 text-pink" />
                    Cookies & Data
                  </h3>
                  <p className="text-sm leading-relaxed">
                    Cookies are used to save your personal information on your computer. It helps to calculate the number of times you use our website. Cookies do not keep any personal data of the visitors. When the user browses, cookies are replaced according to the interests of the users. Here none of your particulars like e-mail address, telephone, name or postal address is collected. We give you a safe shopping experience. Riyathnic gives some aggregate particulars like website statics or demographics to sponsors, advertisers and other third parties. Third parties are not authorised to get any of your personal information. Riyathnic has many links to other websites. But once you leave Riyathnic website, our privacy policy ends.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
