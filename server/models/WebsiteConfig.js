import mongoose from 'mongoose';

const websiteConfigSchema = new mongoose.Schema({
  section: { type: String, required: true, unique: true }, // e.g., 'fresh_arrivals'
  config: mongoose.Schema.Types.Mixed, // flexible config object
});

export default mongoose.model('WebsiteConfig', websiteConfigSchema);
