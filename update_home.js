const fs = require('fs');
const path = require('path');

const filePath = path.join('f:', 'riyathnic web 2', 'pages', 'HomePage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Container
content = content.replace('<div className="bg-black space-y-0 pb-20 overflow-hidden">', '<div className="bg-white text-gold space-y-0 pb-20 overflow-hidden">');

// Colors globally for HomePage
content = content.replace(/text-green-500/g, 'text-pink');
content = content.replace(/bg-green-500/g, 'bg-pink');
content = content.replace(/border-green-500/g, 'border-pink');

content = content.replace(/bg-zinc-950/g, 'bg-white');
content = content.replace(/bg-zinc-900\/50/g, 'bg-white shadow-xl border border-pink/20');
content = content.replace(/bg-zinc-900/g, 'bg-white shadow-lg border border-pink/20');
content = content.replace(/bg-zinc-800/g, 'bg-pink/5');
content = content.replace(/bg-black/g, 'bg-white');

content = content.replace(/text-zinc-500/g, 'text-pink');
content = content.replace(/text-zinc-400/g, 'text-gold');
content = content.replace(/text-zinc-200/g, 'text-gold');
content = content.replace(/text-white/g, 'text-gold');
content = content.replace(/text-black/g, 'text-white'); // For things that were placed on bright backgrounds usually

// Borders
content = content.replace(/border-white\/5/g, 'border-pink/20');
content = content.replace(/border-white\/10/g, 'border-pink/20');
content = content.replace(/border-white\/20/g, 'border-pink/30');

// Shadows
content = content.replace(/rgba\(34,197,94,0\.3\)/g, 'rgba(255,192,203,0.5)'); // green shadow to pink shadow
content = content.replace(/shadow-\[0_0_20px_rgba\(34,197,94,0\.3\)\]/g, 'shadow-[0_0_20px_rgba(255,192,203,0.5)]');

// Exception fixes
content = content.replace('text-[10px] md:text-xs font-bold uppercase tracking-widest text-pink', 'text-[10px] md:text-xs font-bold uppercase tracking-widest text-pink'); // already set
content = content.replace(/bg-white text-white/g, 'bg-gold text-white'); // Button fixes
content = content.replace(/text-black font-black uppercase/g, 'text-gold font-black uppercase'); // Marquee
content = content.replace(/text-white font-black/g, 'text-gold font-black');

// Marquee text update
content = content.replace(/delivery included on order above 999 •          • cash on delivery •          • new collection drop on every month •           • Be a part of trend/g,
                          'delivery included on order above 999 •          • cash on delivery •          • new collection drop on every month •           • Be a part of Riyathnic');

fs.writeFileSync(filePath, content, 'utf8');
console.log('HomePage.tsx updated successfully.');
