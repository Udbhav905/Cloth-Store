import React, { useState, useEffect, useRef } from "react";
import styles from "./Products.module.css";
import { API_BASE_URL } from "../../config";

/* ── Admin token key — must match adminApi.js ── */
const ADMIN_TOKEN_KEY = "luxuria_admin_token";
const getToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) || "";

const sizeOptions = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "FREE",
];

const defaultVariant = {
  size: "",
  color: "",
  colorCode: "#c9a84c",
  sku: "",
  price: "",
  discountedPrice: "",
  stock: "",
  images: [],
  isActive: true,
};

const defaultForm = {
  name: "",
  description: "",
  shortDescription: "",
  category: "",
  subCategory: "",
  brand: "",
  fabric: "",
  pattern: "",
  occasion: [],
  season: [],
  mainImage: null,
  galleryImages: [],
  basePrice: "",
  discountType: "none",
  discountValue: 0,
  variants: [],
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  isActive: true,
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  returnPolicy: { isReturnable: true, returnPeriod: 7 },
};

/* ── Safely parse possibly double-encoded arrays from API ── */
const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    if (
      val.length > 0 &&
      typeof val[0] === "string" &&
      val[0].startsWith("[")
    ) {
      try {
        return JSON.parse(val[0]);
      } catch {
        return val;
      }
    }
    return val;
  }
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [val];
    }
  }
  return [];
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({
    mainImage: null,
    galleryImages: [],
  });
  const [formData, setFormData] = useState(defaultForm);
  const [currentVariant, setCurrentVariant] = useState(defaultVariant);
  const [editingVariantIndex, setEditingVariantIndex] = useState(-1);
  const [submitError, setSubmitError] = useState("");
  const formRef = useRef(null);

  const [filters, setFilters] = useState({
    category: "",
    isActive: "",
    isFeatured: "",
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters.page, filters.category, filters.isActive, filters.isFeatured]);

  useEffect(() => {
    if (showAddForm && formRef.current) {
      setTimeout(
        () =>
          formRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100,
      );
    }
  }, [showAddForm]);

  /* ══════════════════════════════════════════════════════
     The URL is dynamically set via API_BASE_URL
  ══════════════════════════════════════════════════════ */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const q = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.category && { category: filters.category }),
        ...(filters.isActive !== "" && { isActive: filters.isActive }),
        ...(filters.isFeatured !== "" && { isFeatured: filters.isFeatured }),
      });

      /* FIX: query string appended */
      const res = await fetch(`${API_BASE_URL}/products?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
        /* NO credentials:"include" */
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("fetchProducts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        /* NO credentials:"include" */
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      /* categories API may return array directly or { categories: [] } */
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (err) {
      console.error("fetchCategories:", err);
    }
  };

  /* ── Input handler ── */
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      if (name === "mainImage") {
        const file = files[0];
        setFormData((p) => ({ ...p, mainImage: file }));
        if (file) {
          const r = new FileReader();
          r.onloadend = () =>
            setImagePreviews((p) => ({ ...p, mainImage: r.result }));
          r.readAsDataURL(file);
        }
      } else if (name === "galleryImages") {
        const arr = Array.from(files);
        setFormData((p) => ({ ...p, galleryImages: arr }));
        const previews = [];
        arr.forEach((f) => {
          const r = new FileReader();
          r.onloadend = () => {
            previews.push(r.result);
            if (previews.length === arr.length)
              setImagePreviews((p) => ({ ...p, galleryImages: [...previews] }));
          };
          r.readAsDataURL(f);
        });
      }
    } else if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((p) => ({
        ...p,
        [parent]: {
          ...p[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (type === "checkbox") {
      setFormData((p) => ({ ...p, [name]: checked }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleVariantChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentVariant((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addVariant = () => {
    if (
      !currentVariant.size ||
      !currentVariant.color ||
      !currentVariant.sku ||
      !currentVariant.price ||
      !currentVariant.stock
    ) {
      alert(
        "Please fill all required variant fields (Size, Colour, SKU, Price, Stock)",
      );
      return;
    }
    const skuExists = formData.variants.some(
      (v, idx) => v.sku === currentVariant.sku && idx !== editingVariantIndex,
    );
    if (skuExists) {
      alert("SKU already exists. Please use a unique SKU.");
      return;
    }

    if (editingVariantIndex >= 0) {
      const v = [...formData.variants];
      v[editingVariantIndex] = { ...currentVariant };
      setFormData((p) => ({ ...p, variants: v }));
      setEditingVariantIndex(-1);
    } else {
      setFormData((p) => ({
        ...p,
        variants: [...p.variants, { ...currentVariant }],
      }));
    }
    setCurrentVariant(defaultVariant);
  };

  const editVariant = (i) => {
    setCurrentVariant(formData.variants[i]);
    setEditingVariantIndex(i);
  };
  const removeVariant = (i) => {
    setFormData((p) => ({
      ...p,
      variants: p.variants.filter((_, idx) => idx !== i),
    }));
    if (editingVariantIndex === i) {
      setEditingVariantIndex(-1);
      setCurrentVariant(defaultVariant);
    }
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    try {
      const token = getToken();
      const fd = new FormData();

      const add = (key, value) => {
        if (value === null || value === undefined) return;
        if (key === "subCategory") {
          if (value && value !== "") fd.append(key, value);
        } else if (key === "category") {
          if (value) fd.append(key, value);
        } else if (key === "occasion" || key === "season") {
          fd.append(
            key,
            JSON.stringify(Array.isArray(value) && value.length ? value : []),
          );
        } else if (key === "metaKeywords") {
          if (Array.isArray(value) && value.length > 0) {
            fd.append(key, JSON.stringify(value));
          } else if (typeof value === "string" && value.trim()) {
            fd.append(
              key,
              JSON.stringify(
                value
                  .split(",")
                  .map((k) => k.trim())
                  .filter((k) => k),
              ),
            );
          } else {
            fd.append(key, JSON.stringify([]));
          }
        } else if (key === "variants") {
          fd.append(key, JSON.stringify(value || []));
        } else if (key === "returnPolicy") {
          fd.append(key, JSON.stringify(value));
        } else if (typeof value === "boolean") {
          fd.append(key, value.toString());
        } else if (value !== "") {
          fd.append(key, value);
        }
      };

      [
        "name",
        "description",
        "shortDescription",
        "category",
        "subCategory",
        "brand",
        "fabric",
        "pattern",
        "occasion",
        "season",
        "basePrice",
        "discountType",
        "discountValue",
        "variants",
        "isFeatured",
        "isNewArrival",
        "isBestSeller",
        "isActive",
        "returnPolicy",
        "metaTitle",
        "metaDescription",
        "metaKeywords",
      ].forEach((k) => add(k, formData[k]));

      if (formData.mainImage && typeof formData.mainImage !== "string")
        fd.append("mainImage", formData.mainImage);
      (formData.galleryImages || []).forEach((img) => {
        if (typeof img !== "string") fd.append("galleryImages", img);
      });

      const url = editingId
        ? `${API_BASE_URL}/products/${editingId}`
        : `${API_BASE_URL}/products`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        /* NO credentials:"include", NO Content-Type — browser sets multipart automatically */
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save product");
      }

      await fetchProducts();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error("handleSubmit:", err);
      setSubmitError(
        err.message || "Failed to save product. Please try again.",
      );
    }
  };

  /* ══════════════════════════════════════════════════════
     BUG 2 FIX: handleEdit now fetches the FULL product
     from the detail endpoint before populating the form.
     The list endpoint uses LIST_SELECT which omits many
     fields (description, variants, fabric, etc.) needed
     for editing. Fetching by ID gives the full document.
  ══════════════════════════════════════════════════════ */
  const handleEdit = async (product) => {
    try {
      /* Fetch full product details — list endpoint omits many fields */
      const token = getToken();
      const res = await fetch(
        `${API_BASE_URL}/products/${product._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to load product details");
      const data = await res.json();
      /* Controller returns { product: {...} } or the object directly */
      const p = data.product || data;

      setEditingId(p._id);
      setFormData({
        name: p.name || "",
        description: p.description || "",
        shortDescription: p.shortDescription || "",
        /* category/subCategory may be populated objects or plain IDs */
        category: p.category?._id || p.category || "",
        subCategory: p.subCategory?._id || p.subCategory || "",
        brand: p.brand || "",
        fabric: p.fabric || "",
        pattern: p.pattern || "",
        occasion: safeArray(p.occasion),
        season: safeArray(p.season),
        mainImage: null /* cleared — user must re-upload to change */,
        galleryImages: [],
        basePrice: p.basePrice || "",
        discountType: p.discountType || "none",
        discountValue: p.discountValue || 0,
        variants: (p.variants || []).map((v) => ({
          size: v.size || "",
          color: v.color || "",
          colorCode: v.colorCode || "#c9a84c",
          sku: v.sku || "",
          price: v.price || "",
          discountedPrice: v.discountedPrice || "",
          stock: v.stock || "",
          images: v.images || [],
          isActive: v.isActive !== undefined ? v.isActive : true,
        })),
        isFeatured: p.isFeatured || false,
        isNewArrival: p.isNewArrival || false,
        isBestSeller: p.isBestSeller || false,
        isActive: p.isActive !== undefined ? p.isActive : true,
        metaTitle: p.metaTitle || "",
        metaDescription: p.metaDescription || "",
        metaKeywords: safeArray(p.metaKeywords).join(", "),
        returnPolicy: p.returnPolicy || { isReturnable: true, returnPeriod: 7 },
      });
      setImagePreviews({
        mainImage: p.mainImage || null,
        galleryImages: p.galleryImages || [],
      });
      setShowAddForm(true);
    } catch (err) {
      console.error("handleEdit:", err);
      alert("Could not load product for editing: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this product from the catalogue?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchProducts();
    } catch (err) {
      console.error("handleDelete:", err);
      alert("Failed to delete product: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setImagePreviews({ mainImage: null, galleryImages: [] });
    setEditingId(null);
    setCurrentVariant(defaultVariant);
    setEditingVariantIndex(-1);
    setSubmitError("");
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className={styles.productsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>◇</span>Products
          </h1>
          <p className={styles.subtitle}>Curate · Catalogue · Command</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className={styles.controlBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search products or brands…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterWrapper}>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((p) => ({ ...p, category: e.target.value, page: 1 }))
            }
            className={styles.filterSelect}
          >
            <option value="">All Collections</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filters.isActive}
            onChange={(e) =>
              setFilters((p) => ({ ...p, isActive: e.target.value, page: 1 }))
            }
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={filters.isFeatured}
            onChange={(e) =>
              setFilters((p) => ({ ...p, isFeatured: e.target.value, page: 1 }))
            }
            className={styles.filterSelect}
          >
            <option value="">All Types</option>
            <option value="true">Featured</option>
            <option value="false">Standard</option>
          </select>
        </div>
        <button
          className={styles.addButton}
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
        >
          <span className={styles.addIcon}>+</span>
          <span>New Product</span>
        </button>
      </div>

      {/* Form */}
      <div
        ref={formRef}
        className={`${styles.formContainer} ${showAddForm ? styles.formVisible : ""}`}
      >
        <form onSubmit={handleSubmit} className={styles.productForm}>
          <h3 className={styles.formTitle}>
            {editingId ? "✦ Edit Product" : "✦ New Product Entry"}
          </h3>

          {/* Basic Info */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Basic Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={styles.formInput}
                  placeholder="e.g., Cashmere Evening Coat"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Brand / Maison</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="e.g., Luxuria, Atelier X"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Collection *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className={styles.formSelect}
                >
                  <option value="">Select Collection</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sub-Collection</label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                >
                  <option value="">None</option>
                  {categories
                    .filter((c) => {
                      const pid = c.parentCategory?._id || c.parentCategory;
                      return pid && pid.toString() === formData.category;
                    })
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                {!formData.category && (
                  <small className={styles.fieldHint}>
                    Select a collection first
                  </small>
                )}
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Short Description</label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="One-line summary for product cards"
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Full Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className={styles.formTextarea}
                  rows="4"
                  placeholder="Detailed product description…"
                />
              </div>
            </div>
          </div>

          {/* Garment Details */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Garment Details</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fabric / Material</label>
                <input
                  type="text"
                  name="fabric"
                  value={formData.fabric}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="e.g., 100% Cashmere"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pattern</label>
                <input
                  type="text"
                  name="pattern"
                  value={formData.pattern}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="e.g., Solid, Houndstooth"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Occasion</label>
                <input
                  type="text"
                  value={formData.occasion.join(", ")}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      occasion: e.target.value
                        .split(",")
                        .map((o) => o.trim())
                        .filter(Boolean),
                    }))
                  }
                  className={styles.formInput}
                  placeholder="Black Tie, Casual, Business"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Season</label>
                <input
                  type="text"
                  value={formData.season.join(", ")}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      season: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  className={styles.formInput}
                  placeholder="Summer, Winter, All-Season"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Pricing</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Base Price *</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className={styles.formInput}
                  placeholder="0.00"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Discount Type</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              {formData.discountType !== "none" && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Discount Value</label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    min="0"
                    step={formData.discountType === "percentage" ? "1" : "0.01"}
                    className={styles.formInput}
                    placeholder={
                      formData.discountType === "percentage" ? "0–100" : "0.00"
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Product Variants</h4>
            <div className={styles.variantForm}>
              <div className={styles.variantGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Size *</label>
                  <select
                    name="size"
                    value={currentVariant.size}
                    onChange={handleVariantChange}
                    className={styles.formSelect}
                  >
                    <option value="">Select</option>
                    {sizeOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Colour *</label>
                  <input
                    type="text"
                    name="color"
                    value={currentVariant.color}
                    onChange={handleVariantChange}
                    className={styles.formInput}
                    placeholder="Midnight Black"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Colour Swatch</label>
                  <input
                    type="color"
                    name="colorCode"
                    value={currentVariant.colorCode}
                    onChange={handleVariantChange}
                    className={styles.colorInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={currentVariant.sku}
                    onChange={handleVariantChange}
                    className={styles.formInput}
                    placeholder="LX-BLK-S"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={currentVariant.price}
                    onChange={handleVariantChange}
                    min="0"
                    step="0.01"
                    className={styles.formInput}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Discounted Price</label>
                  <input
                    type="number"
                    name="discountedPrice"
                    value={currentVariant.discountedPrice}
                    onChange={handleVariantChange}
                    min="0"
                    step="0.01"
                    className={styles.formInput}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={currentVariant.stock}
                    onChange={handleVariantChange}
                    min="0"
                    className={styles.formInput}
                    placeholder="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={currentVariant.isActive}
                      onChange={handleVariantChange}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className={styles.variantActions}>
                {editingVariantIndex >= 0 && (
                  <button
                    type="button"
                    className={styles.cancelVariantButton}
                    onClick={() => {
                      setEditingVariantIndex(-1);
                      setCurrentVariant(defaultVariant);
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  className={styles.addVariantButton}
                  onClick={addVariant}
                >
                  {editingVariantIndex >= 0 ? "Update Variant" : "Add Variant"}
                </button>
              </div>
            </div>
            {formData.variants.length > 0 && (
              <div className={styles.variantsList}>
                <p className={styles.variantsListTitle}>
                  Added Variants ({formData.variants.length})
                </p>
                {/* Scroll wrapper — horizontal scroll on tablet, card layout on mobile */}
                <div className={styles.variantsTableScroll}>
                  <table className={styles.variantsTable}>
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Colour</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Disc.</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>—</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variants.map((v, i) => (
                        <tr key={i}>
                          <td data-label="Size">{v.size}</td>
                          <td data-label="Colour">
                            <span
                              className={styles.colorDot}
                              style={{ backgroundColor: v.colorCode }}
                            />
                            {v.color}
                          </td>
                          <td data-label="SKU">{v.sku}</td>
                          <td data-label="Price">₹{v.price}</td>
                          <td data-label="Disc.">
                            {v.discountedPrice ? `₹${v.discountedPrice}` : "—"}
                          </td>
                          <td data-label="Stock">{v.stock}</td>
                          <td data-label="Status">
                            <span
                              className={`${styles.statusBadge} ${v.isActive ? styles.active : styles.inactive}`}
                            >
                              {v.isActive ? "Active" : "Off"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.editVariantButton}
                              onClick={() => editVariant(i)}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className={styles.deleteVariantButton}
                              onClick={() => removeVariant(i)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Product Imagery</h4>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Hero Image {!editingId && "*"}
              </label>
              <div className={styles.imageUploadArea}>
                {imagePreviews.mainImage ? (
                  <div className={styles.imagePreview}>
                    <img
                      src={imagePreviews.mainImage}
                      alt="Preview"
                      className={styles.previewImage}
                    />
                    <button
                      type="button"
                      className={styles.removeImage}
                      onClick={() => {
                        setImagePreviews((p) => ({ ...p, mainImage: null }));
                        setFormData((p) => ({ ...p, mainImage: null }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadIcon}>📷</span>
                    <span>
                      {editingId
                        ? "Upload New Image (leave blank to keep current)"
                        : "Upload Hero Image"}
                    </span>
                    <input
                      type="file"
                      name="mainImage"
                      onChange={handleInputChange}
                      accept="image/*"
                      className={styles.fileInput}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Gallery Images</label>
              <div className={styles.galleryUploadArea}>
                <label className={styles.galleryUploadLabel}>
                  <span className={styles.uploadIcon}>🖼️</span>
                  <span>Upload Gallery Images</span>
                  <input
                    type="file"
                    name="galleryImages"
                    onChange={handleInputChange}
                    accept="image/*"
                    multiple
                    className={styles.fileInput}
                  />
                </label>
                {imagePreviews.galleryImages.length > 0 && (
                  <div className={styles.galleryPreviews}>
                    {imagePreviews.galleryImages.map((img, i) => (
                      <div key={i} className={styles.galleryPreviewItem}>
                        <img src={img} alt={`Gallery ${i}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Product Status</h4>
            <div className={styles.statusGrid}>
              {[
                { name: "isActive", icon: "◈", label: "Active" },
                { name: "isFeatured", icon: "✦", label: "Featured" },
                { name: "isNewArrival", icon: "◇", label: "New Arrival" },
                { name: "isBestSeller", icon: "◉", label: "Best Seller" },
              ].map((s) => (
                <label key={s.name} className={styles.checkboxCard}>
                  <input
                    type="checkbox"
                    name={s.name}
                    checked={formData[s.name]}
                    onChange={handleInputChange}
                  />
                  <span className={styles.checkboxCardContent}>
                    <span className={styles.checkboxIcon}>{s.icon}</span>
                    <span>{s.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Return Policy */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Return Policy</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="returnPolicy.isReturnable"
                    checked={formData.returnPolicy.isReturnable}
                    onChange={handleInputChange}
                  />
                  Returnable
                </label>
              </div>
              {formData.returnPolicy.isReturnable && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Return Period (days)
                  </label>
                  <input
                    type="number"
                    name="returnPolicy.returnPeriod"
                    value={formData.returnPolicy.returnPeriod}
                    onChange={handleInputChange}
                    min="1"
                    max="30"
                    className={styles.formInput}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>SEO</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="SEO Title"
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Meta Keywords</label>
                <input
                  type="text"
                  name="metaKeywords"
                  value={formData.metaKeywords}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="cashmere, luxury coat, winter"
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  className={styles.formTextarea}
                  rows="2"
                  placeholder="SEO Description"
                />
              </div>
            </div>
          </div>

          {submitError && (
            <div className={styles.formError}>⚠ {submitError}</div>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              {editingId ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Products Grid */}
      <div className={styles.productsGrid}>
        {loading ? (
          <div className={styles.loaderContainer}>
            <div className={styles.loader} />
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product, idx) => (
            <div
              key={product._id}
              className={styles.productCard}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div
                className={styles.productImageContainer}
                onClick={() => {
                  setSelectedProduct(product);
                  setShowDetailModal(true);
                }}
              >
                <img
                  src={product.mainImage}
                  alt={product.name}
                  className={styles.productImage}
                />
                {product.isFeatured && (
                  <span className={styles.featuredBadge}>Featured</span>
                )}
                {product.isNewArrival && (
                  <span className={styles.newBadge}>New Arrival</span>
                )}
                {product.isBestSeller && (
                  <span className={styles.bestsellerBadge}>Best Seller</span>
                )}
                {!product.isActive && (
                  <span className={styles.inactiveOverlay}>Inactive</span>
                )}
              </div>
              <div className={styles.productInfo}>
                <p className={styles.productBrand}>
                  {product.brand || "Luxuria"}
                </p>
                <h3 className={styles.productName}>{product.name}</h3>
                <div className={styles.productPrice}>
                  <span className={styles.currentPrice}>
                    ₹{product.basePrice}
                  </span>
                  {product.discountType !== "none" && (
                    <span className={styles.discountedPrice}>
                      ₹
                      {product.basePrice -
                        (product.discountType === "percentage"
                          ? (product.basePrice * product.discountValue) / 100
                          : product.discountValue)}
                    </span>
                  )}
                </div>
                <div className={styles.productStats}>
                  <span>◻ {product.totalStock || 0} in stock</span>
                  <span>◉ {product.averageRating || "—"}</span>
                </div>
                <div className={styles.productActions}>
                  <button
                    onClick={() => handleEdit(product)}
                    className={styles.editButton}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className={styles.deleteButton}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>◇</span>
            <h3>No products found</h3>
            <p>Press "New Product" to add your first item</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setShowDetailModal(false)}
            >
              ×
            </button>
            <div className={styles.modalHeader}>
              <img
                src={selectedProduct.mainImage}
                alt={selectedProduct.name}
                className={styles.modalImage}
              />
              <div className={styles.modalHeaderInfo}>
                <p className={styles.modalBrand}>
                  {selectedProduct.brand || "Luxuria"}
                </p>
                <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
                <div className={styles.modalBadges}>
                  {selectedProduct.isFeatured && (
                    <span className={styles.modalBadge}>Featured</span>
                  )}
                  {selectedProduct.isNewArrival && (
                    <span className={styles.modalBadge}>New Arrival</span>
                  )}
                  {selectedProduct.isBestSeller && (
                    <span className={styles.modalBadge}>Best Seller</span>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalBody}>
              {selectedProduct.description && (
                <div className={styles.modalSection}>
                  <h3>Description</h3>
                  <p>{selectedProduct.description}</p>
                </div>
              )}
              <div className={styles.modalGrid}>
                <div className={styles.modalSection}>
                  <h3>Garment Details</h3>
                  <p>
                    <strong>Collection:</strong>{" "}
                    {selectedProduct.category?.name}
                  </p>
                  {selectedProduct.subCategory && (
                    <p>
                      <strong>Sub-collection:</strong>{" "}
                      {selectedProduct.subCategory.name}
                    </p>
                  )}
                  <p>
                    <strong>Fabric:</strong> {selectedProduct.fabric || "—"}
                  </p>
                  <p>
                    <strong>Pattern:</strong> {selectedProduct.pattern || "—"}
                  </p>
                  <p>
                    <strong>Occasion:</strong>{" "}
                    {safeArray(selectedProduct.occasion).join(", ") || "—"}
                  </p>
                  <p>
                    <strong>Season:</strong>{" "}
                    {safeArray(selectedProduct.season).join(", ") || "—"}
                  </p>
                </div>
                <div className={styles.modalSection}>
                  <h3>Pricing & Stock</h3>
                  <p>
                    <strong>Base Price:</strong> ₹{selectedProduct.basePrice}
                  </p>
                  {selectedProduct.discountType !== "none" && (
                    <p>
                      <strong>Discount:</strong> {selectedProduct.discountValue}
                      {selectedProduct.discountType === "percentage"
                        ? "%"
                        : "₹"}
                    </p>
                  )}
                  <p>
                    <strong>Total Stock:</strong> {selectedProduct.totalStock}
                  </p>
                  <p>
                    <strong>Units Sold:</strong>{" "}
                    {selectedProduct.totalSold || 0}
                  </p>
                </div>
              </div>
              {selectedProduct.variants?.length > 0 && (
                <div className={styles.modalSection}>
                  <h3>Variants</h3>
                  <div className={styles.variantsTableScroll}>
                    <table className={styles.variantsTable}>
                      <thead>
                        <tr>
                          <th>Size</th>
                          <th>Colour</th>
                          <th>SKU</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduct.variants.map((v, i) => (
                          <tr key={i}>
                            <td data-label="Size">{v.size}</td>
                            <td data-label="Colour">
                              <span
                                className={styles.colorDot}
                                style={{ backgroundColor: v.colorCode }}
                              />
                              {v.color}
                            </td>
                            <td data-label="SKU">{v.sku}</td>
                            <td data-label="Price">₹{v.price}</td>
                            <td data-label="Stock">{v.stock}</td>
                            <td data-label="Status">
                              <span
                                className={`${styles.statusBadge} ${v.isActive ? styles.active : styles.inactive}`}
                              >
                                {v.isActive ? "Active" : "Off"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {selectedProduct.galleryImages?.length > 0 && (
                <div className={styles.modalSection}>
                  <h3>Gallery</h3>
                  <div className={styles.modalGallery}>
                    {selectedProduct.galleryImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Gallery ${i}`}
                        className={styles.modalGalleryImage}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalEditButton}
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedProduct);
                }}
              >
                ✏️ Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
