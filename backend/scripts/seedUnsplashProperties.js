import mongoose from "mongoose";
import axios from "axios";
import sharp from "sharp";
import imagekit from "../config/imagekit.js";
import connectdb from "../config/mongodb.js";
import Property from "../models/propertyModel.js";
import dotenv from "dotenv";

// Load env explicitly for the script
dotenv.config();

const UNSPLASH_IMAGES = [
  "1570129477035-d8c0f4a8aef2",
  "1512917774080-9991f1c4c750",
  "1580587771525-78b9daa3b14a",
  "1568605114967-8130f3a36994",
  "1600585154340-be6161a56a0c",
  "1600566753376-1203b223a43c",
  "1600607687920-4e2a12cf6a58",
  "1600210492486-724fe5c67fb3",
  "1480074568708-e7b720bb3f09",
  "1512918766755-ee7a628acb05"
];

const PROPERTIES_TO_SEED = [
  {
    title: "Crystal Waters Estate",
    location: "Science City, Ahmedabad",
    price: 38000000,
    bhk: 4,
    beds: 4,
    baths: 4,
    sqft: 3200,
    area_sqft: 3600,
    type: "Villa",
    description: "A stunning contemporary villa featuring a private infinity pool and smart landscape lighting. Located in the peaceful outskirts of Science City.",
    amenities: ["Infinity Pool", "Smart Lighting", "Zen Garden", "Wine Cellar", "Automated Garage"],
    phone: "+91 9123456789",
    city: "Ahmedabad",
    locality: "Science City",
    facing: "North-West",
    status: "active",
    unsplashIds: ["1512917774080-9991f1c4c750", "1600566753376-1203b223a43c"]
  },
  {
    title: "The Ruby Penthouse",
    location: "Prahlad Nagar, Ahmedabad",
    price: 29000000,
    bhk: 3,
    beds: 3,
    baths: 3,
    sqft: 2400,
    area_sqft: 2600,
    type: "Apartment",
    description: "Centrally located luxury apartment with a designer kitchen and a private terrace garden. Perfect for urban living with a touch of nature.",
    amenities: ["Terrace Garden", "Designer Kitchen", "Gym", "Concierge", "24/7 Security"],
    phone: "+91 9876543210",
    city: "Ahmedabad",
    locality: "Prahlad Nagar",
    facing: "East",
    status: "active",
    unsplashIds: ["1580587771525-78b9daa3b14a", "1600607687920-4e2a12cf6a58"]
  },
  {
    title: "Victorian Charm Manor",
    location: "Ambawadi, Ahmedabad",
    price: 55000000,
    bhk: 5,
    beds: 5,
    baths: 5,
    sqft: 4500,
    area_sqft: 5200,
    type: "Bungalow",
    description: "Classic Victorian-inspired architecture blended with modern amenities. Features wrap-around porches and high-ceiling foyers.",
    amenities: ["Large Porch", "Fireplace", "Hardwood Floors", "Library", "Maid's Room"],
    phone: "+91 8887776665",
    city: "Ahmedabad",
    locality: "Ambawadi",
    facing: "South",
    status: "active",
    unsplashIds: ["1480074568708-e7b720bb3f09", "1600210492486-724fe5c67fb3"]
  },
  {
    title: "Urban Skyline Suites",
    location: "Thaltej, Ahmedabad",
    price: 15500000,
    bhk: 2,
    beds: 2,
    baths: 2,
    sqft: 1300,
    area_sqft: 1450,
    type: "Flat",
    description: "Compact yet luxurious living space designed for the fast-paced city life. Features floor-to-ceiling windows and premium fittings.",
    amenities: ["Balcony View", "Modular Kitchen", "Rooftop Lounge", "Steam Room", "Valet Parking"],
    phone: "+91 7776665554",
    city: "Ahmedabad",
    locality: "Thaltej",
    facing: "West",
    status: "active",
    unsplashIds: ["1512918766755-ee7a628acb05", "1570129477035-d8c0f4a8aef2"]
  }
];


async function processAndUploadImage(unsplashId, propertyTitle) {
  try {
    const imageUrl = `https://images.unsplash.com/photo-${unsplashId}?auto=format&fit=crop&w=1600&q=80`;
    console.log(`  - Fetching image: ${unsplashId}`);
    
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    console.log(`  - Converting to WebP...`);
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${propertyTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.webp`;
    console.log(`  - Uploading to ImageKit: ${fileName}`);

    const uploadResponse = await imagekit.upload({
      file: webpBuffer,
      fileName: fileName,
      folder: "/properties/seeded"
    });

    return uploadResponse.url;
  } catch (error) {
    console.error(`  ❌ Error processing image ${unsplashId}:`, error.message);
    return null;
  }
}

async function seed() {
  try {
    console.log("🚀 Starting Property Seeding Process...");
    await connectdb();

    for (const propertyData of PROPERTIES_TO_SEED) {
      console.log(`\n🏠 Processing Property: ${propertyData.title}`);
      
      const imageUrls = [];
      for (const id of propertyData.unsplashIds) {
        const uploadedUrl = await processAndUploadImage(id, propertyData.title);
        if (uploadedUrl) {
          imageUrls.push(uploadedUrl);
        }
      }

      if (imageUrls.length === 0) {
        console.warn(`  ⚠️ No images uploaded for ${propertyData.title}. Skipping property.`);
        continue;
      }

      const { unsplashIds, ...finalPropertyData } = propertyData;
      const newProperty = new Property({
        ...finalPropertyData,
        image: imageUrls
      });

      await newProperty.save();
      console.log(`  ✅ Successfully saved property: ${propertyData.title}`);
    }

    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error during seeding:", error);
    process.exit(1);
  }
}

seed();
