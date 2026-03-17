import Product  from "../model/Product.js";
import Category from "../model/Category.js";
import Review   from "../model/Review.js";
import cache    from "../utils/cache.js";
import { generateSlug }      from "../utils/generateSlug.js";
import { ApiFeatures }       from "../utils/apiFeatures.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

// Fields safe to send for list/card views — never send full description, ratings array, etc.
const LIST_SELECT  = "name slug mainImage basePrice discountType discountValue averageRating totalReviews isBestSeller isNewArrival isFeatured totalStock category subCategory";
const CARD_SELECT  = "name slug mainImage basePrice discountType discountValue averageRating totalReviews totalStock category";

// Invalidate all product-related cache keys after any write
const bustProductCache = () => {
  ["featured", "new-arrivals", "best-sellers"].forEach((k) => cache.del(k));
};

/* ─────────────────────────────────────────────
   CREATE PRODUCT
   POST /api/products
───────────────────────────────────────────── */
export const createProduct = async (req, res) => {
  try {
    const { name, category, variants, ...otherData } = req.body;

    // ── Validate category ──
    const categoryExists = await Category.findById(category).lean();
    if (!categoryExists) {
      return res.status(400).json({ message: "Category not found" });
    }

    const slug = generateSlug(name);

    // ── Duplicate check ──
    const existingProduct = await Product.findOne(
      { $or: [{ name }, { slug }] },
      "_id"          // only fetch _id — fastest possible check
    ).lean();
    if (existingProduct) {
      return res.status(400).json({ message: "Product already exists" });
    }

    // ── Upload images in parallel ──
    const [mainImageUrl, galleryUrls] = await Promise.all([
      req.files?.mainImage?.length > 0
        ? uploadToCloudinary(req.files.mainImage[0].buffer)
        : Promise.resolve(""),
      req.files?.galleryImages?.length > 0
        ? Promise.all(req.files.galleryImages.map((f) => uploadToCloudinary(f.buffer)))
        : Promise.resolve([]),
    ]);

    // ── Parse + validate variants ──
    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
    }

    // ── Upload variant images in parallel ──
    if (req.files?.variantImages?.length > 0 && parsedVariants.length > 0) {
      await Promise.all(
        parsedVariants.map(async (v, i) => {
          if (req.files.variantImages[i]) {
            v.images = [await uploadToCloudinary(req.files.variantImages[i].buffer)];
          }
        })
      );
    }

    // ── Duplicate SKU check ──
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

/* ─────────────────────────────────────────────
   GET ALL PRODUCTS
   GET /api/products
───────────────────────────────────────────── */
export const getProducts = async (req, res) => {
  try {
    // ── Build base query with lean ──
    const baseQuery = Product.find().lean();

    const features = new ApiFeatures(baseQuery, req.query)
      .filter()
      .search()
      .sort()
      .paginate();

    // ── Run query + count in parallel ──
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

/* ─────────────────────────────────────────────
   GET PRODUCT BY ID
   GET /api/products/:id
───────────────────────────────────────────── */
export const getProductById = async (req, res) => {
  try {
    // ── Fetch product + reviews in parallel ──
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

/* ─────────────────────────────────────────────
   GET PRODUCT BY SLUG
   GET /api/products/slug/:slug
───────────────────────────────────────────── */
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .lean()
      .populate("category",    "name slug")
      .populate("subCategory", "name slug");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ── Fetch reviews + related products in parallel ──
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

/* ─────────────────────────────────────────────
   UPDATE PRODUCT
   PUT /api/products/:id
───────────────────────────────────────────── */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, variants, ...otherData } = req.body;

    // ── Update slug if name changed ──
    if (name && name !== product.name) {
      product.name = name;
      product.slug = generateSlug(name);
    }

    // ── Upload new images in parallel ──
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

    // ── Parse + validate variants ──
    if (variants) {
      const parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;

      const skus = parsedVariants.map((v) => v.sku);
      if (new Set(skus).size !== skus.length) {
        return res.status(400).json({ message: "Duplicate SKUs found in variants" });
      }

      product.variants   = parsedVariants;
      product.totalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    // ── Apply scalar + parsed fields ──
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

/* ─────────────────────────────────────────────
   DELETE PRODUCT
   DELETE /api/products/:id
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   GET FEATURED PRODUCTS
   GET /api/products/featured
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   GET NEW ARRIVALS
   GET /api/products/new-arrivals
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   GET BEST SELLERS
   GET /api/products/best-sellers
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   SEARCH PRODUCTS
   GET /api/products/search
───────────────────────────────────────────── */
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

    // ── Price filter ──
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    // ── Natural language price parsing ──
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

    // ── Use $text index when keyword exists ──
    if (keyword) {
      filter.$text = { $search: keyword };
    }

    // ── Single DB query with lean ──
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

    // ── Post-filter for category/brand/fabric matches missed by $text ──
    let results = products;
    if (keyword) {
      const directMatches = new Set(products.map((p) => p._id.toString()));

      // Only run the extra query if the keyword might match category/brand
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

      // Merge — also check populated category name
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