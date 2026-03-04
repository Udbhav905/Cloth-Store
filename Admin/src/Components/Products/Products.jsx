import React, { useState, useEffect, useRef } from 'react';
import styles from './Products.module.css';

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40", "FREE"];

const defaultVariant = {
  size: '', color: '', colorCode: '#c9a84c',
  sku: '', price: '', discountedPrice: '',
  stock: '', images: [], isActive: true
};

const defaultForm = {
  name: '', description: '', shortDescription: '',
  category: '', subCategory: '', brand: '', fabric: '',
  pattern: '', occasion: [], season: [],
  mainImage: null, galleryImages: [],
  basePrice: '', discountType: 'none', discountValue: 0,
  variants: [], isFeatured: false, isNewArrival: false,
  isBestSeller: false, isActive: true,
  metaTitle: '', metaDescription: '', metaKeywords: '',
  returnPolicy: { isReturnable: true, returnPeriod: 7 }
};

// ── Helper: safely parse possibly double-encoded arrays from API ──
const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    if (val.length > 0 && typeof val[0] === 'string' && val[0].startsWith('[')) {
      try { return JSON.parse(val[0]); } catch { return val; }
    }
    return val;
  }
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return [val]; }
  }
  return [];
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({ mainImage: null, galleryImages: [] });
  const [formData, setFormData] = useState(defaultForm);
  const [currentVariant, setCurrentVariant] = useState(defaultVariant);
  const [editingVariantIndex, setEditingVariantIndex] = useState(-1);
  const formRef = useRef(null);

  const [filters, setFilters] = useState({
    category: '', isActive: '', isFeatured: '', page: 1, limit: 10
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters.page, filters.category, filters.isActive, filters.isFeatured]);

  useEffect(() => {
    if (showAddForm && formRef.current) {
      setTimeout(() => formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [showAddForm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const q = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.category && { category: filters.category }),
        ...(filters.isActive !== '' && { isActive: filters.isActive }),
        ...(filters.isFeatured !== '' && { isFeatured: filters.isFeatured })
      });
      const res = await fetch(`http://localhost:3000/api/products?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      setCategories(await res.json());
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      if (name === 'mainImage') {
        const file = files[0];
        setFormData(p => ({ ...p, mainImage: file }));
        if (file) {
          const r = new FileReader();
          r.onloadend = () => setImagePreviews(p => ({ ...p, mainImage: r.result }));
          r.readAsDataURL(file);
        }
      } else if (name === 'galleryImages') {
        const arr = Array.from(files);
        setFormData(p => ({ ...p, galleryImages: arr }));
        const previews = [];
        arr.forEach(f => {
          const r = new FileReader();
          r.onloadend = () => {
            previews.push(r.result);
            if (previews.length === arr.length)
              setImagePreviews(p => ({ ...p, galleryImages: [...previews] }));
          };
          r.readAsDataURL(f);
        });
      }
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(p => ({
        ...p,
        [parent]: { ...p[parent], [child]: type === 'checkbox' ? checked : value }
      }));
    } else if (type === 'checkbox') {
      setFormData(p => ({ ...p, [name]: checked }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleVariantChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentVariant(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const addVariant = () => {
    if (!currentVariant.size || !currentVariant.color || !currentVariant.sku || !currentVariant.price || !currentVariant.stock) {
      alert('Please fill all required variant fields');
      return;
    }

    const skuExists = formData.variants.some((v, idx) =>
      v.sku === currentVariant.sku && idx !== editingVariantIndex
    );
    if (skuExists) {
      alert('SKU already exists. Please use a unique SKU.');
      return;
    }

    if (editingVariantIndex >= 0) {
      const v = [...formData.variants];
      v[editingVariantIndex] = { ...currentVariant };
      setFormData(p => ({ ...p, variants: v }));
      setEditingVariantIndex(-1);
    } else {
      setFormData(p => ({ ...p, variants: [...p.variants, { ...currentVariant }] }));
    }
    setCurrentVariant(defaultVariant);
  };

  const editVariant = (i) => {
    setCurrentVariant(formData.variants[i]);
    setEditingVariantIndex(i);
  };

  const removeVariant = (i) => {
    setFormData(p => ({ ...p, variants: p.variants.filter((_, idx) => idx !== i) }));
    if (editingVariantIndex === i) {
      setEditingVariantIndex(-1);
      setCurrentVariant(defaultVariant);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      const appendIfValid = (key, value) => {
        if (value === null || value === undefined) return;

        if (key === 'subCategory') {
          if (value && value !== '') {
            formDataToSend.append(key, value);
          }
        }
        else if (key === 'category') {
          if (value) {
            formDataToSend.append(key, value);
          }
        }
        else if (key === 'occasion' || key === 'season') {
          if (Array.isArray(value) && value.length > 0) {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, JSON.stringify([]));
          }
        }
        else if (key === 'metaKeywords') {
          if (Array.isArray(value) && value.length > 0) {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (typeof value === 'string' && value.trim()) {
            const keywords = value.split(',').map(k => k.trim()).filter(k => k);
            formDataToSend.append(key, JSON.stringify(keywords));
          } else {
            formDataToSend.append(key, JSON.stringify([]));
          }
        }
        else if (key === 'variants') {
          formDataToSend.append(key, JSON.stringify(value || []));
        }
        else if (key === 'returnPolicy') {
          formDataToSend.append(key, JSON.stringify(value));
        }
        else if (typeof value === 'boolean') {
          formDataToSend.append(key, value.toString());
        }
        else if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      };

      appendIfValid('name', formData.name);
      appendIfValid('description', formData.description);
      appendIfValid('shortDescription', formData.shortDescription);
      appendIfValid('category', formData.category);
      appendIfValid('subCategory', formData.subCategory);
      appendIfValid('brand', formData.brand);
      appendIfValid('fabric', formData.fabric);
      appendIfValid('pattern', formData.pattern);
      appendIfValid('occasion', formData.occasion);
      appendIfValid('season', formData.season);
      appendIfValid('basePrice', formData.basePrice);
      appendIfValid('discountType', formData.discountType);
      appendIfValid('discountValue', formData.discountValue);
      appendIfValid('variants', formData.variants);
      appendIfValid('isFeatured', formData.isFeatured);
      appendIfValid('isNewArrival', formData.isNewArrival);
      appendIfValid('isBestSeller', formData.isBestSeller);
      appendIfValid('isActive', formData.isActive);
      appendIfValid('returnPolicy', formData.returnPolicy);
      appendIfValid('metaTitle', formData.metaTitle);
      appendIfValid('metaDescription', formData.metaDescription);
      appendIfValid('metaKeywords', formData.metaKeywords);

      if (formData.mainImage && typeof formData.mainImage !== 'string') {
        formDataToSend.append('mainImage', formData.mainImage);
      }

      if (formData.galleryImages && formData.galleryImages.length > 0) {
        formData.galleryImages.forEach(image => {
          if (typeof image !== 'string') {
            formDataToSend.append('galleryImages', image);
          }
        });
      }

      const url = editingId
        ? `http://localhost:3000/api/products/${editingId}`
        : 'http://localhost:3000/api/products';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }

      await fetchProducts();
      resetForm();
      setShowAddForm(false);

    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.message || 'Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      category: product.category?._id || product.category || '',
      subCategory: product.subCategory?._id || product.subCategory || '',
      brand: product.brand || '',
      fabric: product.fabric || '',
      pattern: product.pattern || '',
      // ── FIX: use safeArray to prevent double-encoding on re-save ──
      occasion: safeArray(product.occasion),
      season: safeArray(product.season),
      mainImage: null,
      galleryImages: [],
      basePrice: product.basePrice || '',
      discountType: product.discountType || 'none',
      discountValue: product.discountValue || 0,
      variants: product.variants || [],
      isFeatured: product.isFeatured || false,
      isNewArrival: product.isNewArrival || false,
      isBestSeller: product.isBestSeller || false,
      isActive: product.isActive !== undefined ? product.isActive : true,
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      // ── FIX: safeArray prevents '["[\\"keyword\\"]"]' corruption ──
      metaKeywords: safeArray(product.metaKeywords).join(', '),
      returnPolicy: product.returnPolicy || { isReturnable: true, returnPeriod: 7 }
    });
    setImagePreviews({
      mainImage: product.mainImage,
      galleryImages: product.galleryImages || []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product from the catalogue?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Delete failed');
      await fetchProducts();
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setImagePreviews({ mainImage: null, galleryImages: [] });
    setEditingId(null);
    setCurrentVariant(defaultVariant);
    setEditingVariantIndex(-1);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.productsContainer}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>◇</span>
            Products
          </h1>
          <p className={styles.subtitle}>Curate · Catalogue · Command</p>
        </div>
      </div>

      {/* ── Control Bar ── */}
      <div className={styles.controlBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search products or brands…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterWrapper}>
          <select
            value={filters.category}
            onChange={e => setFilters(p => ({ ...p, category: e.target.value, page: 1 }))}
            className={styles.filterSelect}
          >
            <option value="">All Collections</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            value={filters.isActive}
            onChange={e => setFilters(p => ({ ...p, isActive: e.target.value, page: 1 }))}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={filters.isFeatured}
            onChange={e => setFilters(p => ({ ...p, isFeatured: e.target.value, page: 1 }))}
            className={styles.filterSelect}
          >
            <option value="">All Types</option>
            <option value="true">Featured</option>
            <option value="false">Standard</option>
          </select>
        </div>

        <button className={styles.addButton} onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}>
          <span className={styles.addIcon}>+</span>
          <span>New Product</span>
        </button>
      </div>

      {/* ── Form ── */}
      <div ref={formRef} className={`${styles.formContainer} ${showAddForm ? styles.formVisible : ''}`}>
        <form onSubmit={handleSubmit} className={styles.productForm}>
          <h3 className={styles.formTitle}>
            {editingId ? '✦ Edit Product' : '✦ New Product Entry'}
          </h3>

          {/* Basic Info */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Basic Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={styles.formInput} placeholder="e.g., Cashmere Evening Coat" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Brand / Maison</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} className={styles.formInput} placeholder="e.g., Luxuria, Atelier X" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Collection *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required className={styles.formSelect}>
                  <option value="">Select Collection</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sub-Collection</label>
                <select name="subCategory" value={formData.subCategory} onChange={handleInputChange} className={styles.formSelect}>
                  <option value="">None (No Sub-Collection)</option>
                  {categories
                    .filter(c => {
                      const parentId = c.parentCategory?._id || c.parentCategory;
                      return parentId === formData.category;
                    })
                    .map(c => <option key={c._id} value={c._id}>{c.name}</option>)
                  }
                </select>
                {!formData.category && (
                  <small className={styles.fieldHint}>Select a collection first to see sub-collections</small>
                )}
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Short Description</label>
                <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleInputChange} className={styles.formInput} placeholder="One-line summary for product cards" />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Full Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} required className={styles.formTextarea} rows="4" placeholder="Detailed product description, materials, care instructions…" />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Garment Details</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fabric / Material</label>
                <input type="text" name="fabric" value={formData.fabric} onChange={handleInputChange} className={styles.formInput} placeholder="e.g., 100% Cashmere, Silk Blend" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pattern</label>
                <input type="text" name="pattern" value={formData.pattern} onChange={handleInputChange} className={styles.formInput} placeholder="e.g., Solid, Houndstooth" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Occasion</label>
                <input type="text" value={formData.occasion.join(', ')} onChange={e => setFormData(p => ({ ...p, occasion: e.target.value.split(',').map(o => o.trim()).filter(o => o) }))} className={styles.formInput} placeholder="Black Tie, Casual, Business" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Season</label>
                <input type="text" value={formData.season.join(', ')} onChange={e => setFormData(p => ({ ...p, season: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))} className={styles.formInput} placeholder="Summer, Winter, All-Season" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Pricing</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Base Price *</label>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleInputChange} required min="0" step="0.01" className={styles.formInput} placeholder="0.00" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Discount Type</label>
                <select name="discountType" value={formData.discountType} onChange={handleInputChange} className={styles.formSelect}>
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              {formData.discountType !== 'none' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Discount Value</label>
                  <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} min="0" step={formData.discountType === 'percentage' ? '1' : '0.01'} className={styles.formInput} placeholder={formData.discountType === 'percentage' ? '0–100' : '0.00'} />
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
                  <select name="size" value={currentVariant.size} onChange={handleVariantChange} className={styles.formSelect}>
                    <option value="">Select</option>
                    {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Colour *</label>
                  <input type="text" name="color" value={currentVariant.color} onChange={handleVariantChange} className={styles.formInput} placeholder="Midnight Black" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Colour Swatch</label>
                  <input type="color" name="colorCode" value={currentVariant.colorCode} onChange={handleVariantChange} className={styles.colorInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>SKU *</label>
                  <input type="text" name="sku" value={currentVariant.sku} onChange={handleVariantChange} className={styles.formInput} placeholder="LX-BLK-S" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price *</label>
                  <input type="number" name="price" value={currentVariant.price} onChange={handleVariantChange} min="0" step="0.01" className={styles.formInput} placeholder="0.00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Discounted Price</label>
                  <input type="number" name="discountedPrice" value={currentVariant.discountedPrice} onChange={handleVariantChange} min="0" step="0.01" className={styles.formInput} placeholder="0.00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock *</label>
                  <input type="number" name="stock" value={currentVariant.stock} onChange={handleVariantChange} min="0" className={styles.formInput} placeholder="0" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" name="isActive" checked={currentVariant.isActive} onChange={handleVariantChange} />
                    Active
                  </label>
                </div>
              </div>
              <div className={styles.variantActions}>
                {editingVariantIndex >= 0 && (
                  <button type="button" className={styles.cancelVariantButton} onClick={() => { setEditingVariantIndex(-1); setCurrentVariant(defaultVariant); }}>
                    Cancel
                  </button>
                )}
                <button type="button" className={styles.addVariantButton} onClick={addVariant}>
                  {editingVariantIndex >= 0 ? 'Update Variant' : 'Add Variant'}
                </button>
              </div>
            </div>

            {formData.variants.length > 0 && (
              <div className={styles.variantsList}>
                <p className={styles.variantsListTitle}>Added Variants ({formData.variants.length})</p>
                <table className={styles.variantsTable}>
                  <thead>
                    <tr>
                      <th>Size</th><th>Colour</th><th>SKU</th><th>Price</th>
                      <th>Disc.</th><th>Stock</th><th>Status</th><th>—</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((v, i) => (
                      <tr key={i}>
                        <td>{v.size}</td>
                        <td>
                          <span className={styles.colorDot} style={{ backgroundColor: v.colorCode }} />
                          {v.color}
                        </td>
                        <td>{v.sku}</td>
                        <td>${v.price}</td>
                        <td>{v.discountedPrice ? `$${v.discountedPrice}` : '—'}</td>
                        <td>{v.stock}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${v.isActive ? styles.active : styles.inactive}`}>
                            {v.isActive ? 'Active' : 'Off'}
                          </span>
                        </td>
                        <td>
                          <button type="button" className={styles.editVariantButton} onClick={() => editVariant(i)}>✏️</button>
                          <button type="button" className={styles.deleteVariantButton} onClick={() => removeVariant(i)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Images */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Product Imagery</h4>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hero Image *</label>
              <div className={styles.imageUploadArea}>
                {imagePreviews.mainImage ? (
                  <div className={styles.imagePreview}>
                    <img src={imagePreviews.mainImage} alt="Preview" className={styles.previewImage} />
                    <button type="button" className={styles.removeImage} onClick={() => {
                      setImagePreviews(p => ({ ...p, mainImage: null }));
                      setFormData(p => ({ ...p, mainImage: null }));
                    }}>×</button>
                  </div>
                ) : (
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadIcon}>📷</span>
                    <span>Upload Hero Image</span>
                    <input type="file" name="mainImage" onChange={handleInputChange} accept="image/*" className={styles.fileInput} />
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
                  <input type="file" name="galleryImages" onChange={handleInputChange} accept="image/*" multiple className={styles.fileInput} />
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
                { name: 'isActive',     icon: '◈', label: 'Active' },
                { name: 'isFeatured',   icon: '✦', label: 'Featured' },
                { name: 'isNewArrival', icon: '◇', label: 'New Arrival' },
                { name: 'isBestSeller', icon: '◉', label: 'Best Seller' },
              ].map(s => (
                <label key={s.name} className={styles.checkboxCard}>
                  <input type="checkbox" name={s.name} checked={formData[s.name]} onChange={handleInputChange} />
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
                  <input type="checkbox" name="returnPolicy.isReturnable" checked={formData.returnPolicy.isReturnable} onChange={handleInputChange} />
                  Returnable
                </label>
              </div>
              {formData.returnPolicy.isReturnable && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Return Period (days)</label>
                  <input type="number" name="returnPolicy.returnPeriod" value={formData.returnPolicy.returnPeriod} onChange={handleInputChange} min="1" max="30" className={styles.formInput} />
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
                <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleInputChange} className={styles.formInput} placeholder="SEO Title" />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Meta Keywords</label>
                <input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleInputChange} className={styles.formInput} placeholder="cashmere, luxury coat, winter" />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Meta Description</label>
                <textarea name="metaDescription" value={formData.metaDescription} onChange={handleInputChange} className={styles.formTextarea} rows="2" placeholder="SEO Description" />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={() => { setShowAddForm(false); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              {editingId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Products Grid ── */}
      <div className={styles.productsGrid}>
        {loading ? (
          <div className={styles.loaderContainer}><div className={styles.loader} /></div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product, idx) => (
            <div key={product._id} className={styles.productCard} style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className={styles.productImageContainer} onClick={() => { setSelectedProduct(product); setShowDetailModal(true); }}>
                <img src={product.mainImage} alt={product.name} className={styles.productImage} />
                {product.isFeatured   && <span className={styles.featuredBadge}>Featured</span>}
                {product.isNewArrival && <span className={styles.newBadge}>New Arrival</span>}
                {product.isBestSeller && <span className={styles.bestsellerBadge}>Best Seller</span>}
                {!product.isActive    && <span className={styles.inactiveOverlay}>Inactive</span>}
              </div>
              <div className={styles.productInfo}>
                <p className={styles.productBrand}>{product.brand || 'Luxuria'}</p>
                <h3 className={styles.productName}>{product.name}</h3>
                <div className={styles.productPrice}>
                  <span className={styles.currentPrice}>${product.basePrice}</span>
                  {product.discountType !== 'none' && (
                    <span className={styles.discountedPrice}>
                      ${product.basePrice - (product.discountType === 'percentage' ? (product.basePrice * product.discountValue / 100) : product.discountValue)}
                    </span>
                  )}
                </div>
                <div className={styles.productStats}>
                  <span>◻ {product.totalStock || 0} in stock</span>
                  <span>◉ {product.averageRating || '—'}</span>
                </div>
                <div className={styles.productActions}>
                  <button onClick={() => handleEdit(product)} className={styles.editButton}>✏️ Edit</button>
                  <button onClick={() => handleDelete(product._id)} className={styles.deleteButton}>🗑️ Delete</button>
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

      {/* ── Detail Modal ── */}
      {showDetailModal && selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowDetailModal(false)}>×</button>

            <div className={styles.modalHeader}>
              <img src={selectedProduct.mainImage} alt={selectedProduct.name} className={styles.modalImage} />
              <div className={styles.modalHeaderInfo}>
                <p className={styles.modalBrand}>{selectedProduct.brand || 'Luxuria'}</p>
                <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
                <div className={styles.modalBadges}>
                  {selectedProduct.isFeatured   && <span className={styles.modalBadge}>Featured</span>}
                  {selectedProduct.isNewArrival  && <span className={styles.modalBadge}>New Arrival</span>}
                  {selectedProduct.isBestSeller  && <span className={styles.modalBadge}>Best Seller</span>}
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
                  <p><strong>Collection:</strong> {selectedProduct.category?.name}</p>
                  {selectedProduct.subCategory && <p><strong>Sub-collection:</strong> {selectedProduct.subCategory.name}</p>}
                  <p><strong>Fabric:</strong> {selectedProduct.fabric || '—'}</p>
                  <p><strong>Pattern:</strong> {selectedProduct.pattern || '—'}</p>
                  <p><strong>Occasion:</strong> {safeArray(selectedProduct.occasion).join(', ') || '—'}</p>
                  <p><strong>Season:</strong> {safeArray(selectedProduct.season).join(', ') || '—'}</p>
                </div>
                <div className={styles.modalSection}>
                  <h3>Pricing & Stock</h3>
                  <p><strong>Base Price:</strong> ${selectedProduct.basePrice}</p>
                  {selectedProduct.discountType !== 'none' && <p><strong>Discount:</strong> {selectedProduct.discountValue}{selectedProduct.discountType === 'percentage' ? '%' : '$'}</p>}
                  <p><strong>Total Stock:</strong> {selectedProduct.totalStock}</p>
                  <p><strong>Units Sold:</strong> {selectedProduct.totalSold || 0}</p>
                </div>
              </div>

              {selectedProduct.variants?.length > 0 && (
                <div className={styles.modalSection}>
                  <h3>Variants</h3>
                  <table className={styles.variantsTable}>
                    <thead>
                      <tr><th>Size</th><th>Colour</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {selectedProduct.variants.map((v, i) => (
                        <tr key={i}>
                          <td>{v.size}</td>
                          <td>
                            <span className={styles.colorDot} style={{ backgroundColor: v.colorCode }} />
                            {v.color}
                          </td>
                          <td>{v.sku}</td>
                          <td>${v.price}</td>
                          <td>{v.stock}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${v.isActive ? styles.active : styles.inactive}`}>
                              {v.isActive ? 'Active' : 'Off'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedProduct.galleryImages?.length > 0 && (
                <div className={styles.modalSection}>
                  <h3>Gallery</h3>
                  <div className={styles.modalGallery}>
                    {selectedProduct.galleryImages.map((img, i) => (
                      <img key={i} src={img} alt={`Gallery ${i}`} className={styles.modalGalleryImage} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalEditButton} onClick={() => { setShowDetailModal(false); handleEdit(selectedProduct); }}>
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