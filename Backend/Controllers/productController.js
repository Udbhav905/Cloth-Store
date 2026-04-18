import Product  from "../model/Product.js";
import Category from "../model/Category.js";
import Review   from "../model/Review.js";
import cache    from "../utils/cache.js";
import { generateSlug }      from "../utils/generateSlug.js";
import { ApiFeatures }       from "../utils/apiFeatures.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const LIST_SELECT  = "name slug mainImage basePrice discountType discountValue averageRating totalReviews isBestSeller isNewArrival isFeatured totalStock category subCategory";
const CARD_SELECT  = "name slug mainImage basePrice discountType discountValue averageRating totalReviews totalStock category";

const bustProductCache = () => {
  ["featured", "new-arrivals", "best-sellers"].forEach((k) => cache.del(k));
};

export const createProduct = async (req, res) => {
  try {
    const { name, category, variants, ...otherData } = req.body;

    const categoryExists = await Category.findById(category).lean();
    if (!categoryExists) {
      return res.status(400).json({ message: "Category not found" });
    }

    const slug = generateSlug(name);

    const existingProduct = await Product.findOne(
      { $or: [{ name }, { slug }] },
      "_id"         
    ).lean();
    if (existingProduct) {
      return res.status(400).json({ message: "Product already exists" });
    }

    const [mainImageUrl, galleryUrls] = await Promise.all([
      req.files?.mainImage?.length > 0
        ? uploadToCloudinary(req.files.mainImage[0].buffer)
        : Promise.resolve(""),
      req.files?.galleryImages?.length > 0
        ? Promise.all(req.files.galleryImages.map((f) => uploadToCloudinary(f.buffer)))
        : Promise.resolve([]),
    ]);

    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
    }

    if (req.files?.variantImages?.length > 0 && parsedVariants.length > 0) {
      await Promise.all(
        parsedVariants.map(async (v, i) => {
          if (req.files.variantImages[i]) {
            v.images = [await uploadToCloudinary(req.files.variantImages[i].buffer)];
          }
        })
      );
    }

    if (parsedVariants.length > 0) {
      const skus = parsedVariants.map((v) => v.sku);
      if (new Set(skus).size !== skus.length) {
        return res.status(400).json({ message: "Duplicate SKUs found" });
      }
    }

    const totalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

    const product = await Product.create({
      ...otherData,
      name,
      slug,
      category,
      mainImage:     mainImageUrl,
      galleryImages: galleryUrls,
      variants:      parsedVariants,
      totalStock,
    });

    bustProductCache();
    return res.status(201).json(product);
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const baseQuery = Product.find().lean();

    const features = new ApiFeatures(baseQuery, req.query)
      .filter()
      .search()
      .sort()
      .paginate();

    const [products, totalCount] = await Promise.all([
      features.query
        .populate("category",    "name slug")
        .populate("subCategory", "name slug")
        .select(LIST_SELECT),
      Product.countDocuments(features.filterQuery || {}),
    ]);

    const limit = parseInt(req.query.limit) || 10;
    const page  = parseInt(req.query.page)  || 1;

    return res.json({
      success: true,
      count:   products.length,
      total:   totalCount,
      page,
      pages:   Math.ceil(totalCount / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getProductById = async (req, res) => {
  try {
    const [product, reviews] = await Promise.all([
      Product.findById(req.params.id)
        .lean()
        .populate("category",    "name slug")
        .populate("subCategory", "name slug"),
      Review.find({ productId: req.params.id, isApproved: true })
        .lean()
        .populate("userId", "name")
        .select("userId rating review createdAt")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ product: { ...product, reviews } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .lean()
      .populate("category",    "name slug")
      .populate("subCategory", "name slug");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const [reviews, relatedProducts] = await Promise.all([
      Review.find({ productId: product._id, isApproved: true })
        .lean()
        .populate("userId", "name")
        .select("userId rating review createdAt")
        .sort({ createdAt: -1 })
        .limit(20),
      Product.find({
        category: product.category._id,
        _id:      { $ne: product._id },
        isActive: true,
      })
        .lean()
        .select(CARD_SELECT)
        .limit(4),
    ]);

    return res.json({ ...product, reviews, relatedProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 50, page = 1, sort = "-createdAt" } = req.query;
    
    const category = await Category.findOne({ slug }).lean();
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    console.log(`🔍 Found category: ${category.name} (ID: ${category._id})`);
    console.log(`🔍 Parent category: ${category.parentCategory}`);
    
    const subCategories = await Category.find({ parentCategory: category._id }).lean();
    const subCategoryIds = subCategories.map(sc => sc._id);
    
    console.log(`📁 Found ${subCategories.length} subcategories:`, subCategories.map(sc => sc.name));
    
    const query = {
      isActive: true,
      $or: [
        { category: category._id },
        { subCategory: category._id } 
      ]
    };
    
    if (subCategoryIds.length > 0) {
      query.$or.push({ subCategory: { $in: subCategoryIds } });
    }
    
    console.log("📝 Query:", JSON.stringify(query, null, 2));
    
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .lean()
      .select("name slug mainImage basePrice discountType discountValue averageRating totalReviews isBestSeller isNewArrival isFeatured totalStock category subCategory")
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    console.log(`✅ Found ${products.length} products for category: ${category.name}`);
    console.log("📦 Products:", products.map(p => ({ name: p.name, category: p.category?.name, subCategory: p.subCategory?.name })));
    
    res.json({
      success: true,
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentCategory: category.parentCategory
      },
      subCategories: subCategories.map(sc => ({
        _id: sc._id,
        name: sc.name,
        slug: sc.slug
      })),
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error("Error in getProductsByCategory:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET PRODUCTS BY SUBCATEGORY
   GET /api/products/subcategory/:slug
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   GET PRODUCTS BY SUBCATEGORY
   GET /api/products/subcategory/:slug
───────────────────────────────────────────── */
export const getProductsBySubCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 50, page = 1, sort = "-createdAt" } = req.query;
    
    const subCategory = await Category.findOne({ slug }).lean();
    
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    
    console.log(`🔍 Found subcategory: ${subCategory.name} (ID: ${subCategory._id})`);
    
    let parentCategory = null;
    if (subCategory.parentCategory) {
      parentCategory = await Category.findById(subCategory.parentCategory).lean();
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find({ 
      subCategory: subCategory._id,
      isActive: true 
    })
      .lean()
      .select("name slug mainImage basePrice discountType discountValue averageRating totalReviews isBestSeller isNewArrival isFeatured totalStock category subCategory")
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments({ subCategory: subCategory._id, isActive: true });
    
    console.log(`✅ Found ${products.length} products for subcategory: ${subCategory.name}`);
    
    res.json({
      success: true,
      subCategory: {
        _id: subCategory._id,
        name: subCategory.name,
        slug: subCategory.slug,
        description: subCategory.description,
        image: subCategory.image,
        parentCategory: parentCategory ? {
          _id: parentCategory._id,
          name: parentCategory.name,
          slug: parentCategory.slug
        } : null
      },
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error("Error in getProductsBySubCategory:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, variants, ...otherData } = req.body;

    if (name && name !== product.name) {
      product.name = name;
      product.slug = generateSlug(name);
    }

    if (req.files) {
      const [mainImageUrl, galleryUrls] = await Promise.all([
        req.files.mainImage?.length > 0
          ? uploadToCloudinary(req.files.mainImage[0].buffer)
          : Promise.resolve(null),
        req.files.galleryImages?.length > 0
          ? Promise.all(req.files.galleryImages.map((f) => uploadToCloudinary(f.buffer)))
          : Promise.resolve(null),
      ]);

      if (mainImageUrl)  product.mainImage     = mainImageUrl;
      if (galleryUrls)   product.galleryImages = [...(product.galleryImages || []), ...galleryUrls];
    }

    if (variants) {
      const parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;

      const skus = parsedVariants.map((v) => v.sku);
      if (new Set(skus).size !== skus.length) {
        return res.status(400).json({ message: "Duplicate SKUs found in variants" });
      }

      product.variants   = parsedVariants;
      product.totalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    const JSON_FIELDS  = ["returnPolicy"];
    const ARRAY_FIELDS = ["occasion", "season", "metaKeywords"];

    Object.entries(otherData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (JSON_FIELDS.includes(key) && typeof value === "string") {
        try { product[key] = JSON.parse(value); } catch { product[key] = value; }
      } else if (ARRAY_FIELDS.includes(key) && typeof value === "string") {
        try { product[key] = JSON.parse(value); }
        catch { product[key] = value.split(",").map((s) => s.trim()); }
      } else {
        product[key] = value;
      }
    });

    const updatedProduct = await product.save();

    bustProductCache();
    return res.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    bustProductCache();
    return res.json({ message: "Product removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const CACHE_KEY = "featured";
    const cached = cache.get(CACHE_KEY);
    if (cached) return res.json(cached);

    const products = await Product.find({ isFeatured: true, isActive: true })
      .lean()
      .select(LIST_SELECT)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(12);

    cache.set(CACHE_KEY, products);
    return res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNewArrivals = async (req, res) => {
  try {
    const CACHE_KEY = "new-arrivals";
    const cached = cache.get(CACHE_KEY);
    if (cached) return res.json(cached);

    const products = await Product.find({ isNewArrival: true, isActive: true })
      .lean()
      .select(LIST_SELECT)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(12);

    cache.set(CACHE_KEY, products);
    return res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBestSellers = async (req, res) => {
  try {
    const CACHE_KEY = "best-sellers";
    const cached = cache.get(CACHE_KEY);
    if (cached) return res.json(cached);

    const products = await Product.find({ isBestSeller: true, isActive: true })
      .lean()
      .select(LIST_SELECT)
      .populate("category", "name slug")
      .sort({ totalSold: -1 })
      .limit(12);

    cache.set(CACHE_KEY, products);
    return res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const {
      q        = "",
      minPrice,
      maxPrice,
      page  = 1,
      limit = 40,
    } = req.query;

    const filter = { isActive: true };

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    if (q) {
      const underMatch = q.match(/(?:under|below|less\s*than)\s*₹?\$?(\d+)/i);
      const overMatch  = q.match(/(?:over|above|more\s*than)\s*₹?\$?(\d+)/i);
      if (underMatch) filter.basePrice = { ...(filter.basePrice || {}), $lte: parseInt(underMatch[1]) };
      if (overMatch)  filter.basePrice = { ...(filter.basePrice || {}), $gte: parseInt(overMatch[1]) };
    }

    const skip    = (Number(page) - 1) * Number(limit);
    const keyword = q
      .replace(/(?:under|below|less\s*than|over|above|more\s*than)\s*₹?\$?\d+/gi, "")
      .trim()
      .toLowerCase();

    if (keyword) {
      filter.$text = { $search: keyword };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .lean()
        .select(LIST_SELECT)
        .populate("category",    "name slug")
        .populate("subCategory", "name slug")
        .sort(keyword ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    let results = products;
    if (keyword) {
      const directMatches = new Set(products.map((p) => p._id.toString()));

      const extraProducts = await Product.find({
        isActive: true,
        ...(filter.basePrice ? { basePrice: filter.basePrice } : {}),
        $or: [
          { brand:   { $regex: keyword, $options: "i" } },
          { fabric:  { $regex: keyword, $options: "i" } },
          { occasion:{ $regex: keyword, $options: "i" } },
          { season:  { $regex: keyword, $options: "i" } },
        ],
      })
        .lean()
        .select(LIST_SELECT)
        .populate("category",    "name slug")
        .populate("subCategory", "name slug")
        .limit(Number(limit));

      const merged = extraProducts.filter(
        (p) =>
          !directMatches.has(p._id.toString()) &&
          (p.category?.name?.toLowerCase().includes(keyword) ||
            p.subCategory?.name?.toLowerCase().includes(keyword) ||
            p.brand?.toLowerCase().includes(keyword) ||
            p.fabric?.toLowerCase().includes(keyword) ||
            (p.occasion || []).some((o) => o.toLowerCase().includes(keyword)) ||
            (p.season   || []).some((s) => s.toLowerCase().includes(keyword)))
      );

      results = [...products, ...merged];
    }

    return res.status(200).json({
      products: results,
      total:    results.length,
      page:     Number(page),
      limit:    Number(limit),
    });
  } catch (error) {
    console.error("[searchProducts] error:", error);
    res.status(500).json({ message: error.message });
  }
};