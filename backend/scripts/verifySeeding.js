import connectdb from "../config/mongodb.js";
import Property from "../models/propertyModel.js";

async function verify() {
  try {
    await connectdb();
    const properties = await Property.find({
      $or: [
        { title: "The Golden Horizon Villa" },
        { title: "The Royal Heritage Mansion" },
        { title: "Minimalist Zen Loft" },
        { title: "Crystal Waters Estate" },
        { title: "Victorian Charm Manor" }
      ]
    });

    console.log(`Found ${properties.length} properties:`);
    properties.forEach(p => {
      console.log(`- ${p.title}: ${p.image[0]}`);
      const isWebp = p.image.every(img => img.endsWith('.webp'));
      console.log(`  WebP format: ${isWebp ? '✅' : '❌'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

verify();
