const cloudinary = require('cloudinary').v2;
const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = require("./kyes");

try{
  cloudinary.config({ 
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
  });
  console.log("✅ OK: Cloudinary connection");
} catch(error) {
  console.log("❌ ERROR: Cloudinary connection");
  console.error(error.message);
}

module.exports = cloudinary