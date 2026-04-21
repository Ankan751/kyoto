import fs from "fs";
import sharp from "sharp";
import imagekit from "../config/imagekit.js";
import Property from "../models/propertyModel.js";
import { deleteImagesFromImageKit } from "../utils/imageKitCleanup.js";
import { getMapEmbedFromSharedLink } from "../utils/mapUtils.js";

const addproperty = async (req, res) => {
    try {
        const { title, location, price, beds, baths, length, breadth, sqft, type, description, amenities, phone, googleMapLink, city, instagramLink, youtubeLink, facing } = req.body;

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        // Convert images to WebP via Sharp, then Upload to ImageKit
        const imageUrls = await Promise.all(
            images.map(async (item) => {
                // Read from multer disk storage
                const originalBuffer = fs.readFileSync(item.path);
                
                // Process straight to compressed WebP
                const webpBuffer = await sharp(originalBuffer)
                    .webp({ quality: 80, effort: 4 })
                    .toBuffer();

                const originalNameWithoutExt = item.originalname.substring(0, item.originalname.lastIndexOf('.')) || item.originalname;
                const newFileName = `${originalNameWithoutExt}.webp`;

                const result = await imagekit.upload({
                    file: webpBuffer,
                    fileName: newFileName,
                    folder: "Property",
                });
                fs.unlink(item.path, (err) => {
                    if (err) console.log("Error deleting the file: ", err);
                });
                return result.url;
            })
        );
        
        // Resolve Google Maps link if provided
        let mapEmbedUrl = '';
        let coordinates = { lat: '', lng: '' };
        if (googleMapLink) {
            try {
                const mapData = await getMapEmbedFromSharedLink(googleMapLink);
                if (mapData) {
                    mapEmbedUrl = mapData.embedUrl;
                }
            } catch (err) {
                console.warn("Failed to resolve map link during property creation:", err.message);
            }
        }

        // Create a new product
        const product = new Property({
            title,
            location,
            price,
            beds: beds ? Number(beds) : 0,
            baths: baths ? Number(baths) : 0,
            length: length ? Number(length) : 0,
            breadth: breadth ? Number(breadth) : 0,
            sqft,
            type,
            description,
            amenities,
            image: imageUrls,
            phone,
            googleMapLink: googleMapLink || '',
            mapEmbedUrl,
            city: city || '',
            instagramLink: instagramLink || '',
            youtubeLink: youtubeLink || '',
            facing: facing || '',
        });

        // Save the product to the database
        await product.save();

        res.json({ message: "Product added successfully", success: true });
    } catch (error) {
        console.log("Error adding product: ", error);
        res.status(500).json({ message: "Server Error", error: error.message, stack: error.stack, success: false });
    }
};

// --- Memory Cache Layer ---
const lruCache = new Map();
const MAX_CACHE_SIZE = 100;

function setCache(key, value, ttlMinutes = 5) {
  if (lruCache.size >= MAX_CACHE_SIZE) {
    const firstKey = lruCache.keys().next().value;
    lruCache.delete(firstKey);
  }
  lruCache.set(key, {
    data: value,
    expiry: Date.now() + ttlMinutes * 60 * 1000
  });
}

function getCache(key) {
  const item = lruCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    lruCache.delete(key);
    return null;
  }
  return item.data;
}
// --------------------------

const featuredproperty = async (req, res) => {
    try {
        const cacheKey = "featured_properties";
        const cached = getCache(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const property = await Property.find({
            $or: [{ status: 'active' }, { status: { $exists: false } }]
        }, {
            title: 1, location: 1, city: 1, price: 1, beds: 1, bhk: 1, baths: 1,
            sqft: 1, area_sqft: 1, type: 1, length: 1, breadth: 1, facing: 1, 
            locality: 1, tags: 1, image: { $slice: 1 }, status: 1
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(); // Faster responses

        const payload = { property, success: true };
        setCache(cacheKey, payload, 10); // Cache for 10 mins

        res.json(payload);
    } catch (error) {
        console.log("Error fetching featured properties: ", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

const listproperty = async (req, res) => {
    try {
        // Generate stable cache key by sorting parameters
        const cacheKeyRaw = Object.keys(req.query).sort().reduce((acc, k) => {
            acc[k] = req.query[k];
            return acc;
        }, {});
        const cacheKey = `list:${JSON.stringify(cacheKeyRaw)}`;

        const cached = getCache(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 50); // Hard cap at 50
        const skip = (page - 1) * limit;

        const { search, minPrice, maxPrice, propertyType, bedrooms, bathrooms, facing, amenities } = req.query;

        // Base query: Only return active properties publicly.
        const query = {
            $or: [{ status: 'active' }, { status: { $exists: false } }],
        };

        // Hybrid Search implementation
        if (search) {
            if (search.length >= 3) {
                query.$text = { $search: search };
            } else {
                query.$or = [
                    { location: { $regex: search, $options: "i" } },
                    { city: { $regex: search, $options: "i" } }
                ];
            }
        }

        // Exact numeric boundary handling for price
        if (minPrice !== undefined && minPrice !== '') {
            const min = Number(minPrice);
            if (!Number.isNaN(min)) {
                query.price = query.price || {};
                query.price.$gte = min;
            }
        }
        if (maxPrice !== undefined && maxPrice !== '') {
            const max = Number(maxPrice);
            if (!Number.isNaN(max)) {
                query.price = query.price || {};
                query.price.$lte = max;
            }
        }

        if (propertyType) {
            if (Array.isArray(propertyType)) {
                // If multiple types provided
                query.type = { $in: propertyType.map(t => new RegExp(`^${t}$`, 'i')) };
            } else {
                // Ignore case
                query.type = new RegExp(`^${propertyType}$`, 'i');
            }
        }

        if (bedrooms) {
            query.beds = { $gte: Number(bedrooms) };
        }

        if (bathrooms) {
            query.baths = { $gte: Number(bathrooms) };
        }

        if (facing) {
            query.facing = new RegExp(`^${facing}$`, 'i');
        }

        if (amenities) {
            if (Array.isArray(amenities)) {
                query.amenities = { $all: amenities.map(a => new RegExp(`^${a}$`, 'i')) };
            } else {
                query.amenities = new RegExp(`^${amenities}$`, 'i');
            }
        }

        // Parallel execution for count and fetch to improve throughput
        // Projection limits the heavy fields. We handle image slicing in JS to avoid $slice errors on non-array fields.
        const [propertyRaw, totalProperties] = await Promise.all([
            Property.find(query, {
                title: 1, location: 1, city: 1, price: 1, beds: 1, bhk: 1, baths: 1,
                sqft: 1, area_sqft: 1, type: 1, length: 1, breadth: 1, facing: 1, 
                locality: 1, tags: 1, image: 1, status: 1,
                instagramLink: 1, youtubeLink: 1
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Property.countDocuments(query)
        ]);

        // Safely truncate image arrays to 1 element for thumbnails in the list view
        const property = propertyRaw.map(p => ({
            ...p,
            image: Array.isArray(p.image) ? p.image.slice(0, 1) : (p.image ? [p.image] : [])
        }));

        const totalPages = Math.ceil(totalProperties / limit);

        const payload = {
            property,
            success: true,
            pagination: {
                currentPage: page,
                totalPages,
                totalProperties,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                limit
            }
        };

        setCache(cacheKey, payload, 5); // Cache for 5 mins
        
        res.json(payload);
    } catch (error) {
        console.error("CRITICAL: Error listing products:", {
            message: error.message,
            stack: error.stack,
            query: req.query
        });
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: error.message,
            stack: error.stack,
            success: false 
        });
    }
};

const removeproperty = async (req, res) => {
    try {
        const property = await Property.findById(req.body.id);
        if (!property) {
            return res.status(404).json({ message: "Property not found", success: false });
        }

        // Delete images from ImageKit
        if (property.image && property.image.length > 0) {
            await deleteImagesFromImageKit(property.image);
        }

        await Property.findByIdAndDelete(req.body.id);
        return res.json({ message: "Property removed successfully", success: true });
    } catch (error) {
        console.log("Error removing product: ", error);
        return res.status(500).json({ message: "Server Error", success: false });
    }
};

const updateproperty = async (req, res) => {
    try {
        console.log("Update Property Request Body:", req.body);
        console.log("Update Property Files:", req.files);
        const { id, title, location, price, beds, baths, length, breadth, sqft, type, description, amenities, phone, googleMapLink, city, instagramLink, youtubeLink, facing } = req.body;

        const property = await Property.findById(id);
        if (!property) {
            console.log("Property not found with ID:", id); // Debugging line
            return res.status(404).json({ message: "Property not found", success: false });
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            // No new images provided
            property.title = title;
            property.location = location;
            property.price = price;
            if (beds !== undefined) property.beds = beds;
            if (baths !== undefined) property.baths = baths;
            if (length !== undefined) property.length = length;
            if (breadth !== undefined) property.breadth = breadth;
            property.sqft = sqft;
            property.type = type;
            property.description = description;
            property.amenities = amenities;
            property.phone = phone;
            // Re-resolve map if link changed OR if embed URL is missing
            if (googleMapLink && (googleMapLink !== property.googleMapLink || !property.mapEmbedUrl)) {
                try {
                    const mapData = await getMapEmbedFromSharedLink(googleMapLink);
                    if (mapData) {
                        property.mapEmbedUrl = mapData.embedUrl;
                    }
                } catch (err) {
                    console.warn("Failed to resolve map link during property update:", err.message);
                }
            } else if (!googleMapLink) {
                property.mapEmbedUrl = '';
            }

            property.googleMapLink = googleMapLink || '';

            property.city = city || '';
            property.instagramLink = instagramLink || '';
            property.youtubeLink = youtubeLink || '';
            property.facing = facing || '';
            
            // Check if there are existing images passed in body
            if (req.body.existingImages) {
                const existingImages = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages];
                property.image = existingImages;
            }
            
            console.log("Saving property. mapEmbedUrl:", property.mapEmbedUrl);
            await property.save();
            return res.json({ message: "Property updated successfully", success: true });
        }

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        // Convert images to WebP via Sharp, then Upload to ImageKit
        const newImageUrls = await Promise.all(
            images.map(async (item) => {
                // Read from multer disk storage
                const originalBuffer = fs.readFileSync(item.path);
                
                // Process straight to compressed WebP
                const webpBuffer = await sharp(originalBuffer)
                    .webp({ quality: 80, effort: 4 })
                    .toBuffer();

                const originalNameWithoutExt = item.originalname.substring(0, item.originalname.lastIndexOf('.')) || item.originalname;
                const newFileName = `${originalNameWithoutExt}.webp`;

                const result = await imagekit.upload({
                    file: webpBuffer,
                    fileName: newFileName,
                    folder: "Property",
                });
                fs.unlink(item.path, (err) => {
                    if (err) console.log("Error deleting the file: ", err);
                });
                return result.url;
            })
        );

        let finalImages = [];
        if (req.body.existingImages) {
            const existingImages = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages];
            
            // Check for removed images to cleanup ImageKit
            const removedImages = property.image.filter(img => !existingImages.includes(img));
            if (removedImages.length > 0) {
                await deleteImagesFromImageKit(removedImages);
            }
            
            finalImages = [...existingImages];
        } else if (images.length > 0 && property.image.length > 0) {
            // If new images are uploaded and no existing images provided, 
            // assume all old images are being replaced.
            await deleteImagesFromImageKit(property.image);
        }
        finalImages = [...finalImages, ...newImageUrls];

        property.title = title;
        property.location = location;
        property.price = price;
        if (beds !== undefined) property.beds = beds;
        if (baths !== undefined) property.baths = baths;
        if (length !== undefined) property.length = length;
        if (breadth !== undefined) property.breadth = breadth;
        property.sqft = sqft;
        property.type = type;
        property.description = description;
        property.amenities = amenities;
        property.image = finalImages.length > 0 ? finalImages : property.image;
        property.phone = phone;
        // Re-resolve map if link changed OR if embed URL is missing
        if (googleMapLink && (googleMapLink !== property.googleMapLink || !property.mapEmbedUrl)) {
            try {
                const mapData = await getMapEmbedFromSharedLink(googleMapLink);
                if (mapData) {
                    property.mapEmbedUrl = mapData.embedUrl;
                }
            } catch (err) {
                console.warn("Failed to resolve map link during property update:", err.message);
            }
        } else if (!googleMapLink) {
            property.mapEmbedUrl = '';
        }

        property.googleMapLink = googleMapLink || '';

        property.city = city || '';
        property.instagramLink = instagramLink || '';
        property.youtubeLink = youtubeLink || '';
        property.facing = facing || '';

        console.log("Saving property (with images). mapEmbedUrl:", property.mapEmbedUrl);
        await property.save();
        res.json({ message: "Property updated successfully", success: true });
    } catch (error) {
        console.log("Error updating product: ", error);
        res.status(500).json({ message: "Server Error", error: error.message, stack: error.stack, success: false });
    }
};

const singleproperty = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Property not found", success: false });
        }
        console.log("Fetching property. mapEmbedUrl in DB:", property.mapEmbedUrl);
        // Block public access to listings that are not yet approved or have been
        // rejected/expired. Legacy docs without a status field are always visible.
        if (property.status && property.status !== 'active') {
            return res.status(404).json({ message: "Property not found", success: false });
        }
        res.json({ property, success: true });
    } catch (error) {
        console.log("Error fetching property:", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

export { addproperty, listproperty, removeproperty, updateproperty, singleproperty, featuredproperty };