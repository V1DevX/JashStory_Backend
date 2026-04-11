const { Category } = require("../models");

const addCategory = async (req, res, next) => {
  try {
    const { title, desc } = req.body;
    const { _id: userId } = res.locals.user;

    const isExist = await Category.findOne({
      $or: [
        { "title.en": title.en },
        { "title.ru": title.ru },
        { "title.kg": title.kg },
      ],
    });
    if (isExist) {
      return res.status(400).json({ status: false, message: "Category already exists" });
    }

    const category = new Category({ title, desc, createdBy: userId, updatedBy: userId });
    await category.save();

    return res.status(201).json({
      status:  true,
      message: "Category added successfully",
      data:    category,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id }          = req.params;
    const { _id: userId } = res.locals.user;
    const { title, desc } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    if (title) {
      // Check uniqueness only for fields that actually changed
      const orConditions = [];
      if (title.en && title.en !== category.title.en) orConditions.push({ "title.en": title.en });
      if (title.ru && title.ru !== category.title.ru) orConditions.push({ "title.ru": title.ru });
      if (title.kg && title.kg !== category.title.kg) orConditions.push({ "title.kg": title.kg });

      if (orConditions.length) {
        const conflict = await Category.findOne({ $or: orConditions, _id: { $ne: id } });
        if (conflict) {
          return res.status(400).json({ status: false, message: "Title already exists" });
        }
      }

      category.title = { ...category.title.toObject(), ...title };
    }

    if (desc !== undefined) category.desc = desc;
    category.updatedBy = userId;

    await category.save();

    return res.status(200).json({
      status:  true,
      message: "Category updated successfully",
      data:    category,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    return res.status(200).json({
      status:  true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const { q, lang = "en", size, page } = req.query;

    const sizeNumber = parseInt(size) || 10;
    const pageNumber = parseInt(page) || 1;

    let filter = {};
    if (q) {
      const rx = new RegExp(q, "i");
      filter = {
        $or: [
          { "title.en": rx },
          { "title.ru": rx },
          { "title.kg": rx },
        ],
      };
    }

    const total = await Category.countDocuments(filter);
    const pages = Math.ceil(total / sizeNumber);

    const categories = await Category.find(filter)
      .select(`title desc`)
      .skip((pageNumber - 1) * sizeNumber)
      .limit(sizeNumber)
      .sort({ _id: -1 })
      .lean();

    return res.status(200).json({
      status:  true,
      message: "Categories fetched successfully",
      data:    { categories, total, pages },
    });
  } catch (error) {
    next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const { id }      = req.params;
    const { lang = "en" } = req.query;

    const category = await Category.findById(id)
      .select(`title.${lang} desc createdBy updatedBy createdAt updatedAt`)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();

    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    return res.status(200).json({
      status:  true,
      message: "Category fetched successfully",
      data:    category,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addCategory, updateCategory, deleteCategory, getCategories, getCategory };
