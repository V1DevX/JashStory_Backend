const validateExtension = (ext) => {
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  return allowedExts.includes(ext.toLowerCase());
};

module.exports = { validateExtension };
