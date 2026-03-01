import Category from "../model/Category.js";
import { generateSlug } from "../utils/generateSlug.js";
import cloudinary from "../config/cloudinary.js";

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin

export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, sortOrder, metadata } = req.body;

    const slug = generateSlug(name);

    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // --- Cloudinary Upload ---
    let imageUrl = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "categories",
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer); // pipe the memory buffer to cloudinary
      });

      imageUrl = uploadResult.secure_url;
    }

    const category = await Category.create({
      name,
      slug,
      description,
      parentCategory: parentCategory || null,
      image: imageUrl,
      sortOrder: sortOrder || 0,
      metadata: JSON.parse(req.body.metadata),
    });

    res.status(201).json(category);
  } catch (error) {
    console.log("--------------->", error);
    res.status(500).json({ message: error.message, err: "not ok" });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const { active, parent } = req.query;

    let query = {};

    if (active === "true") {
      query.isActive = true;
    }

    if (parent === "null") {
      query.parentCategory = null;
    } else if (parent) {
      query.parentCategory = parent;
    }

    const categories = await Category.find(query)
      .populate("parentCategory", "name slug")
      .sort({ sortOrder: 1, name: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "parentCategory",
      "name slug",
    );

    if (category) {
      const subCategories = await Category.find({
        parentCategory: category._id,
      });

      res.json({
        ...category.toObject(),
        subCategories,
      });
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate(
      "parentCategory",
      "name slug",
    );

    if (category) {
      const subCategories = await Category.find({
        parentCategory: category._id,
      });

      res.json({
        ...category.toObject(),
        subCategories,
      });
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    console.log("req body", req.body);
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const {
      name,
      description,
      parentCategory,
      image,
      isActive,
      sortOrder,
      metadata,
    } = req.body;

    // Handle name and slug
    if (name && name !== category.name) {
      category.slug = generateSlug(name);
      category.name = name;
    } else if (name) {
      category.name = name;
    }

    // Handle description
    if (description !== undefined) {
      category.description = description;
    }

    // Fix: Handle parentCategory properly - convert empty string to null
    if (parentCategory !== undefined) {
      category.parentCategory = parentCategory === '' ? null : parentCategory;
    }

    // Handle image
    if (image !== undefined) {
      category.image = image;
    }

    // Handle isActive
    if (isActive !== undefined) {
      category.isActive = isActive === 'true' || isActive === true;
    }

    // Handle sortOrder
    if (sortOrder !== undefined) {
      category.sortOrder = parseInt(sortOrder) || 0;
    }

    // Handle metadata
    if (req.body.metadata) {
      try {
        const parsedMetadata = typeof req.body.metadata === 'string' 
          ? JSON.parse(req.body.metadata) 
          : req.body.metadata;
        category.metadata = parsedMetadata;
      } catch (err) {
        return res.status(400).json({ message: "Invalid metadata JSON" });
      }
    }

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    console.log("------", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const hasSubCategories = await Category.exists({
      parentCategory: category._id,
    });

    if (hasSubCategories) {
      return res.status(400).json({
        message:
          "Cannot delete category with subcategories. Delete subcategories first.",
      });
    }

    await category.deleteOne();
    res.json({ message: "Category removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category tree (hierarchy)
// @route   GET /api/categories/tree
// @access  Public
export const getCategoryTree = async (req, res) => {
  try {
    const buildTree = async (parentId = null) => {
      const categories = await Category.find({
        parentCategory: parentId,
        isActive: true,
      });

      const tree = await Promise.all(
        categories.map(async (category) => ({
          _id: category._id,
          name: category.name,
          slug: category.slug,
          image: category.image,
          children: await buildTree(category._id),
        })),
      );

      return tree;
    };

    const tree = await buildTree(null);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
