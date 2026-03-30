const fs = require('fs');
const path = require('path');

const files = [
  'components/Header.tsx',
  'components/Footer.tsx',
  'components/TextRotatorSection.tsx',
  'pages/HomePage.tsx'
];

for (const file of files) {
  const p = path.join('f:', 'riyathnic web 2', file);
  if (fs.existsSync(p)) {
    let raw = fs.readFileSync(p, 'utf8');
    
    // Replace text-gold with text-[#ffbf00]
    raw = raw.replace(/\btext-gold\b/g, 'text-[#ffbf00]');
    raw = raw.replace(/\bbg-gold\b/g, 'bg-[#ffbf00]');
    raw = raw.replace(/\bborder-gold\b/g, 'border-[#ffbf00]');
    
    // Replace pink with hex
    raw = raw.replace(/\btext-pink\b/g, 'text-[#FFC0CB]');
    raw = raw.replace(/\bbg-pink\b/g, 'bg-[#FFC0CB]');
    raw = raw.replace(/\bborder-pink\b/g, 'border-[#FFC0CB]');
    
    // Handle opacity variants
    raw = raw.replace(/-pink\//g, '-[#FFC0CB]/');
    raw = raw.replace(/-gold\//g, '-[#ffbf00]/');
    
    fs.writeFileSync(p, raw, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${p}`);
  }
}
