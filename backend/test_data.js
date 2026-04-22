import mongoose from 'mongoose';
import Property from './models/propertyModel.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    // Search for properties with "gift city" in any field
    const properties = await Property.find({
      $or: [
        { location: /gift city/i },
        { title: /gift city/i },
        { city: /gift city/i },
        { locality: /gift city/i }
      ]
    });
    
    console.log(`Found ${properties.length} properties related to GIFT City:`);
    properties.forEach(p => {
      console.log(`- Title: ${p.title}`);
      console.log(`  City: "${p.city}"`);
      console.log(`  Locality: "${p.locality}"`);
      console.log(`  Location: "${p.location}"`);
      console.log(`  BHK: ${p.bhk || p.beds}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
