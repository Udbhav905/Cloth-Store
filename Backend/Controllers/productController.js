import Product from "../model/Product.js";
import Category from "../model/Category.js";
import Review from "../model/Review.js";
import { generateSlug } from "../utils/generateSlug.js";
import { ApiFeatures } from "../utils/apiFeatures.js";

// @desc    Create product
// @route   POST /api/products
import cloudinary from "../config/cloudinary.js"; // Make sure you have this
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { name, category, variants, ...otherData } = req.body;

    // Validate Category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category not found" });
    }

    // Generate Slug
    const slug = generateSlug(name);

    // Prevent Duplicate Product
    const existingProduct = await Product.findOne({
      $or: [{ name }, { slug }]
    });

    if (existingProduct) {
      return res.status(400).json({ message: "Product already exists" });
    }

    // Upload to Cloudinary (you need to implement this function)
    

    // Upload MAIN IMAGE
    let mainImageUrl = "";
    if (req.files?.mainImage?.length > 0) {
mainImageUrl = await uploadToCloudinary(req.files.mainImage[0].buffer);    }

    // Upload GALLERY IMAGES
    let galleryUrls = [];
    if (req.files?.galleryImages?.length > 0) {
      galleryUrls = await Promise.all(
        req.files.galleryImages.map(file => uploadToCloudinary(file.buffer))
      );
    }

    // Parse Variants (form-data sends string)
    let parsedVariants = [];
    if (variants) {
      parsedVariants = JSON.parse(variants);
    }

    // Upload Variant Images
    if (req.files?.variantImages?.length > 0 && parsedVariants.length > 0) {
      for (let i = 0; i < parsedVariants.length; i++) {
        if (req.files.variantImages[i]) {
          const imageUrl = await uploadToCloudinary(req.files.variantImages[i].buffer);
          parsedVariants[i].images = [imageUrl];
        }
      }
    }

    // Duplicate SKU Check
    if (parsedVariants.length > 0) {
      const skus = parsedVariants.map(v => v.sku);
      if (new Set(skus).size !== skus.length) {
        return res.status(400).json({ message: "Duplicate SKUs found" });
      }
    }

    // Total Stock Calculation
    const totalStock = parsedVariants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );

    // Create Product
    const product = await Product.create({
      ...otherData,
      name,
      slug,
      category,
      mainImage: mainImageUrl,
      galleryImages: galleryUrls,
      variants: parsedVariants,
      totalStock
    });

    res.status(201).json(product);

  } catch (error) {
    console.log("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ... rest of your controller functions remain the same
// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const features = new ApiFeatures(Product.find(), req.query)
      .filter()
      .search()
      .sort()
      .paginate();

    const products = await features.query
      .populate("category", "name slug")
      .populate("subCategory", "name slug");

    const totalCount = await Product.countDocuments();

    res.json({
      success: true,
      count: products.length,
      total: totalCount,
      page: parseInt(req.query.page) || 1,
      pages: Math.ceil(totalCount / (parseInt(req.query.limit) || 10)),
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .populate("subCategory", "name slug");

    if (product) {
      // Get reviews for this product
      const reviews = await Review.find({ 
        productId: product._id,
        isApproved: true 
      }).populate("userId", "name");

      res.json({
        ...product.toObject(),
        reviews
      });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("category", "name slug")
      .populate("subCategory", "name slug");

    if (product) {
      // Get reviews
      const reviews = await Review.find({ 
        productId: product._id,
        isApproved: true 
      }).populate("userId", "name");

      // Get related products
      const relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        isActive: true
      })
      .limit(4)
      .select("name slug mainImage basePrice discountType discountValue variants");

      res.json({
        ...product.toObject(),
        reviews,
        relatedProducts
      });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Update product - req.body:", req.body);
    console.log("Update product - req.files:", req.files);

    // Handle FormData - req.body might be empty if using FormData without proper middleware
    // The data will be in req.body after multer processes it
    const { name, variants, ...otherData } = req.body;

    // If req.body is empty but we have form data, parse it
    let productData = otherData;
    
    // Parse variants if it's a string
    let parsedVariants = variants;
    if (variants && typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        console.error("Error parsing variants:", e);
      }
    }

    // Update slug if name changed
    if (name && name !== product.name) {
      product.slug = generateSlug(name);
      product.name = name;
    } else if (name) {
      product.name = name;
    }

    // Handle image uploads if present
    if (req.files) {
      // Handle main image update
      if (req.files.mainImage && req.files.mainImage.length > 0) {
        const mainImageUrl = await uploadToCloudinary(req.files.mainImage[0].buffer);
        product.mainImage = mainImageUrl;
      }

      // Handle gallery images update
      if (req.files.galleryImages && req.files.galleryImages.length > 0) {
        const galleryUrls = await Promise.all(
          req.files.galleryImages.map(file => uploadToCloudinary(file.buffer))
        );
        product.galleryImages = [...(product.galleryImages || []), ...galleryUrls];
      }
    }

    // Check for duplicate SKUs in variants
    if (parsedVariants && parsedVariants.length > 0) {
      const skus = parsedVariants.map(v => v.sku);
      const uniqueSkus = new Set(skus);
      if (uniqueSkus.size !== skus.length) {
        return res.status(400).json({ message: "Duplicate SKUs found in variants" });
      }
      
      product.variants = parsedVariants;
      
      // Recalculate total stock
      product.totalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    // Update other fields from productData
    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined && productData[key] !== null) {
        // Handle nested objects like returnPolicy
        if (key === 'returnPolicy' && typeof productData[key] === 'string') {
          try {
            product[key] = JSON.parse(productData[key]);
          } catch {
            product[key] = productData[key];
          }
        }
        // Handle arrays that might be JSON strings
        else if (['occasion', 'season', 'metaKeywords'].includes(key) && typeof productData[key] === 'string') {
          try {
            product[key] = JSON.parse(productData[key]);
          } catch {
            product[key] = productData[key].split(',').map(item => item.trim());
          }
        }
        else {
          product[key] = productData[key];
        }
      }
    });

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      isFeatured: true, 
      isActive: true 
    })
    .limit(8)
    .populate("category", "name slug")
    .select("name slug mainImage basePrice discountType discountValue variants");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
export const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ 
      isNewArrival: true, 
      isActive: true 
    })
    .limit(8)
    .sort({ createdAt: -1 })
    .populate("category", "name slug")
    .select("name slug mainImage basePrice discountType discountValue variants");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get best sellers
// @route   GET /api/products/best-sellers
// @access  Public
export const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({ 
      isBestSeller: true, 
      isActive: true 
    })
    .limit(8)
    .populate("category", "name slug")
    .select("name slug mainImage basePrice discountType discountValue variants");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};