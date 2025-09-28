const path = require("path");
const cloudinary = require("../config/cloudinary")
const { validateExtension } = require("../validators/image");
const { File } = require("../models");

const uploadFile = async (req, res, next) => {
  try {
    const { file } = req;
    const { public_id, tags } = req.body;
    
    if (!file) {
      res.status(400).json({
        code: 400,
        status: false,
        message: "File is not selected",
      })
    }
    
    const ext = path.extname(file.originalname);
    if (!validateExtension(ext)) {
      res.status(400).json({
        code: 400,
        status: false,
        message: "Only .jpg / .jpeg / .png / .webp format is allowed",
      })
    }

    const options = {
      folder: 'posts',
      resource_type: 'image',
      // context: `alt=It is alt | caption=It is Caption`,
      tags,
      overwrite: true,
      invalidate: true
    }
    if (public_id) {options.public_id=public_id}
    else {options.use_filename = true}

    // Загрузка файла в Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error){ return reject(error) };
        return resolve(result);
      }).end(req.file.buffer)
    });
    //  сохранение в БД
    // const newFile = new File()
    // newfile.save()
    
    res.status(201).json({ 
      public_id: uploadResult.public_id, 
      url: uploadResult.secure_url 
    });
  
    
  } catch (error) {
    next(error);
  }
};

const getSignedUrl = async (req, res, next) => {
  try {
    const { key } = req.query;
    const url = await signedUrl(key);

    res.status(200).json({
      code: 200,
      status: true,
      message: "Get signed url successfully",
      data: { url },
    });
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { public_id } = req.query;

    const result = await cloudinary.uploader.destroy(public_id)

    res
      .status(200)
      .json({ code: 200, status: true, message: "File deleted successfully", result });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, getSignedUrl, deleteFile };
