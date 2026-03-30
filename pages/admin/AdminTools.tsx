import React from 'react';
import { Link as LinkIcon } from 'lucide-react';

const tools = [
  {
    key: 'firebase',
    name: 'Firebase Console',
    url: 'https://console.firebase.google.com/u/4/',
    imageUrl: 'https://firebase.google.com/static/images/brand-guidelines/logo-logomark.png',
  },
  {
    key: 'shiprocket',
    name: 'Shiprocket',
    url: 'https://app.shiprocket.in/seller/home',
    imageUrl: 'https://cdn.aptoide.com/imgs/6/5/a/65a6d8008b7a9a5512d7bf9968307eda_icon.png?w=128',
  },
  {
    key: 'razorpay',
    name: 'Razorpay',
    url: 'https://dashboard.razorpay.com/app/home',
    imageUrl: 'https://play-lh.googleusercontent.com/BVW7AnYp-O6777L5GDzRlZjkyUz2rsZcfFudlnN7a-EIAbAk1Q-80rIb1P5m6Bc-uA=w480-h960-rw',
  },
  {
    key: 'twilio',
    name: 'Twilio',
    url: 'https://www.twilio.com/en-us',
    imageUrl: 'https://www.twilio.com/favicon.ico',
  },
  {
    key: 'godaddy',
    name: 'GoDaddy',
    url: 'https://www.godaddy.com/en-in',
    imageUrl: 'https://cdn.dribbble.com/userupload/25817803/file/original-13d685e2f83a3015ae517022db1c1b6d.jpg?resize=1504x1504&vertical=center',
  },
  {
    key: 'hostinger',
    name: 'Hostinger',
    url: 'https://hpanel.hostinger.com/',
    imageUrl: 'https://www.hostinger.com/favicon.ico',
  },
  {
    key: 'Gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app',
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFwAAABcCAMAAADUMSJqAAABC1BMVEX///8AAADPz8/5+fnz8/PT09SlpabMzMyZmZnn5+fs7OycnJzg4ODj4+OqqqvCwsPa2tuOjo6Tk5Qcf/+Zvf75+/8vh//l7v+CgoMrKyy5ubn/9/f+6en4W1v7oKDmOEf57e/sUVfKW3u/ocgkJCh4eHnvgYHQXXWoeK92fdbM2vttbW1JSUvvmovOa22lfql9iNZcjPJCivv+7+TrnGPJhlmakJhxkdD85bn6w2vvpADMrDqdrHNyo65SmN4AAAs7Ozzx123XzxKyyjyDvm5XrKVGm9f8+OXB22p/xllYtYpNpL9Ok+a535BrwGtAndFIkPBcXF2g14xEprNGvnQAqI2BvMSd2q7o9uwjKvjaAAABwklEQVRoge2TaVPbMBCGtZZ8yHYcKUBwUtoCTdpSuy3Qmx6mXG25WpVA+f+/hJXTJB5mEs/A8IXZ54v2taXHtrRmjCAIgiAIgiAIgrgvPLhD99LDO5Q/erxcjSLROuHTJssgHJetcNqsMUsrq08qMQLo9QCSKbP7EIzKFFq18qfPnq+9qLizWIg4n7auocNJKevcL1+9Xt/YHNkbkJXjcFviJIlxn2LWSJocU5czLjlmZTOWs9Vv3r57/2Gj3Z6bXyizhsbkpgeIZk3QOGY25RicqMw588Gfpf74aevzl6/fUN6ea88v4pUM7Gs3kS73IbIP8P2ip3CDUaUxgOvBtuQp+A44M+Xfd3b39g+uy6V9Y/CzQirldvqOPV1lD1JAUsqVLb0aOWM/fv46PDreHG9LCva8OGddcPJex5I59vMVdCdyUZa1csZOTvd//xkfqAvpsDCd0GwzIQTn/s3l7O/h2cGkFVPQdmkKHnYlLpZG3UZ+OTi/qMQ+FMbYJmEsh6xfFOE1ufNf7jmzu2XIv4GoRlcb01Jl6RkTYX9H2J5hhB3PA1cG0g34qKyXXw7q59ycmh+NIAiCIAiCIAiCuM9cASLvI4QxyxHYAAAAAElFTkSuQmCC',
  },
];

const AdminTools: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight">Tools</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Quick access to external dashboards
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map(tool => (
          <a
            key={tool.key}
            href={tool.url}
            target="_blank"
            rel="noreferrer"
            className="group bg-zinc-900/60 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center hover:border-green-500 hover:bg-zinc-900 transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-4 overflow-hidden border border-white/10">
              <img src={tool.imageUrl} alt={tool.name} className="w-12 h-12 object-contain" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-white">{tool.name}</p>
            <div className="mt-3 inline-flex items-center text-[10px] font-black uppercase tracking-[0.25em] text-green-500 group-hover:text-white">
              <LinkIcon className="w-3 h-3 mr-1" />
              Open
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default AdminTools;

