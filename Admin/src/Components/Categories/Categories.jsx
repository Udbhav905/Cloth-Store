import React, { useState, useEffect } from "react";
import styles from "./Categories.module.css";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentCategory: "",
    image: null,
    isActive: true,
    sortOrder: 0,
    metadata: {
      title: "",
      description: "",
      keywords: "",
    },
  });
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      console.log(data);

      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));

      // Create preview
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else if (name.includes(".")) {
      // Handle nested objects (like metadata.title)
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      // Helper function to append data properly
      const appendIfExists = (key, value) => {
        if (value === null || value === undefined || value === "") {
          // For parentCategory, we want to explicitly set it to null in the backend
          // So we append it as an empty string and let backend handle it
          if (key === "parentCategory") {
            formDataToSend.append(key, "");
          }
          // Skip other null values
          return;
        }

        if (key === "metadata" && typeof value === "object") {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      };

      // Append all form fields
      appendIfExists("name", formData.name);
      appendIfExists("description", formData.description);
      appendIfExists("parentCategory", formData.parentCategory);
      appendIfExists("isActive", formData.isActive);
      appendIfExists("sortOrder", formData.sortOrder);
      appendIfExists("metadata", formData.metadata);

      // Handle image separately
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const url = editingId
        ? `http://localhost:3000/api/categories/${editingId}`
        : "http://localhost:3000/api/categories";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save category");
      }

      await fetchCategories();
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error saving category:", error);
      alert(error.message);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      // Fix: Send null instead of empty string for parentCategory when it's null
      parentCategory:
        category.parentCategory?._id || category.parentCategory || null,
      image: null,
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
      metadata: {
        title: category.metadata?.title || "",
        description: category.metadata?.description || "",
        keywords: category.metadata?.keywords?.join(", ") || "",
      },
    });

    setImagePreview(category.image);
    setShowAddForm(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/categories/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Failed to delete category");

      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parentCategory: "",
      image: null,
      isActive: true,
      sortOrder: 0,
      metadata: {
        title: "",
        description: "",
        keywords: "",
      },
    });
    setImagePreview(null);
    setEditingId(null);
  };

  const viewCategoryDetails = (category) => {
    setSelectedCategory(category);
    setShowDetailModal(true);
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const buildCategoryTree = (categories, parentId = null) => {
    return categories
      .filter(
        (cat) => (cat.parentCategory?._id || cat.parentCategory) === parentId,
      )
      .map((cat) => ({
        ...cat,
        children: buildCategoryTree(categories, cat._id),
      }));
  };

  const categoryTree = buildCategoryTree(filteredCategories);

  const renderCategoryItem = (category, depth = 0) => (
    <div
      key={category._id}
      className={styles.categoryItem}
      style={{ marginLeft: `${depth * 30}px` }}
    >
      <div className={styles.categoryItemContent}>
        <div
          className={styles.categoryInfo}
          onClick={() => viewCategoryDetails(category)}
        >
          {category.image && (
            <img
              src={
                category.image.startsWith("http")
                  ? category.image
                  : `http://localhost:3000${category.image}`
              }
              alt={category.name}
              className={styles.categoryImage}
            />
          )}
          <div className={styles.categoryDetails}>
            <h4 className={styles.categoryName}>
              {category.name}
              {!category.isActive && (
                <span className={styles.inactiveBadge}>Inactive</span>
              )}
            </h4>
            {category.description && (
              <p className={styles.categoryDescription}>
                {category.description.substring(0, 60)}...
              </p>
            )}
          </div>
        </div>
        <div className={styles.categoryActions}>
          <button
            onClick={() => handleEdit(category)}
            className={styles.editButton}
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => handleDelete(category._id)}
            className={styles.deleteButton}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      {category.children?.map((child) => renderCategoryItem(child, depth + 1))}
    </div>
  );

  return (
    <div className={styles.categoriesContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🏷️</span>
            Categories Management
          </h1>
          <p className={styles.subtitle}>
            Organize your products with beautiful categories
          </p>
        </div>
      </div>

      {/* Search and Add Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button
          className={styles.addButton}
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
        >
          <span className={styles.addIcon}>+</span>
          Add Category
        </button>
      </div>

      {/* Add/Edit Form Dropdown */}
      <div
        className={`${styles.formContainer} ${showAddForm ? styles.formVisible : ""}`}
      >
        <form onSubmit={handleSubmit} className={styles.categoryForm}>
          <h3 className={styles.formTitle}>
            {editingId ? "✏️ Edit Category" : "➕ Add New Category"}
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={styles.formInput}
                placeholder="e.g., Men's Fashion"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Parent Category</label>
              <select
                name="parentCategory"
                value={formData.parentCategory || ""}
                onChange={handleInputChange}
                className={styles.formSelect}
              >
                <option value="">None (Top Level)</option>
                {categories
                  .filter((cat) => cat._id !== editingId) // Don't show current category
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sort Order</label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
                className={styles.formInput}
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={styles.formTextarea}
                rows="3"
                placeholder="Describe this category..."
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Category Image</label>
              <div className={styles.imageUploadArea}>
                {imagePreview ? (
                  <div className={styles.imagePreview}>
                    <img
                      src={imagePreview} // Remove the conditional logic, just use the URL directly
                      alt="Preview"
                      onError={(e) => {
                        console.error("Image failed to load:", imagePreview);
                        e.target.style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      className={styles.removeImage}
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({ ...prev, image: null }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadIcon}>📁</span>
                    <span>Click to upload image</span>
                    <input
                      type="file"
                      name="image"
                      onChange={handleInputChange}
                      accept="image/*"
                      className={styles.fileInput}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className={styles.formGroupHalf}>
              <label className={styles.formLabel}>Meta Title</label>
              <input
                type="text"
                name="metadata.title"
                value={formData.metadata.title}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="SEO Title"
              />
            </div>

            <div className={styles.formGroupHalf}>
              <label className={styles.formLabel}>Meta Keywords</label>
              <input
                type="text"
                name="metadata.keywords"
                value={formData.metadata.keywords}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="fashion, clothing, etc."
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Meta Description</label>
              <textarea
                name="metadata.description"
                value={formData.metadata.description}
                onChange={handleInputChange}
                className={styles.formTextarea}
                rows="2"
                placeholder="SEO Description"
              />
            </div>
          </div>

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
              {editingId ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className={styles.categoriesList}>
        <h2 className={styles.listTitle}>
          <span className={styles.listIcon}>📋</span>
          All Categories ({filteredCategories.length})
        </h2>

        {loading ? (
          <div className={styles.loaderContainer}>
            <div className={styles.loader}></div>
          </div>
        ) : (
          <div className={styles.categoryTree}>
            {categoryTree.length > 0 ? (
              categoryTree.map((category) => renderCategoryItem(category))
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🏷️</span>
                <h3>No categories found</h3>
                <p>
                  Click the "Add Category" button to create your first category
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Detail Modal */}
      {showDetailModal && selectedCategory && (
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
              {selectedCategory.image && (
                <img
                  src={
                    selectedCategory.image.startsWith("http")
                      ? selectedCategory.image
                      : `http://localhost:3000${selectedCategory.image}`
                  }
                  alt={selectedCategory.name}
                  className={styles.modalImage}
                />
              )}
              <div>
                <h2 className={styles.modalTitle}>{selectedCategory.name}</h2>
                <span
                  className={`${styles.modalStatus} ${selectedCategory.isActive ? styles.active : styles.inactive}`}
                >
                  {selectedCategory.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className={styles.modalBody}>
              {selectedCategory.description && (
                <div className={styles.modalSection}>
                  <h3>Description</h3>
                  <p>{selectedCategory.description}</p>
                </div>
              )}

              <div className={styles.modalGrid}>
                <div className={styles.modalSection}>
                  <h3>Category Details</h3>
                  {/* <p>
                    <strong>ID:</strong> {selectedCategory._id}
                  </p> */}
                  <p>
                    <strong>Slug:</strong> {selectedCategory.slug}
                  </p>
                  <p>
                    <strong>Sort Order:</strong>{" "}
                    {selectedCategory.sortOrder || 0}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedCategory.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {selectedCategory.parentCategory && (
                  <div className={styles.modalSection}>
                    <h3>Parent Category</h3>
                    <p>
                      <strong>Name:</strong>{" "}
                      {selectedCategory.parentCategory.name}
                    </p>
                  </div>
                )}

                {selectedCategory.metadata && (
                  <div className={styles.modalSection}>
                    <h3>SEO Information</h3>
                    {selectedCategory.metadata.title && (
                      <p>
                        <strong>Title:</strong>{" "}
                        {selectedCategory.metadata.title}
                      </p>
                    )}
                    {selectedCategory.metadata.description && (
                      <p>
                        <strong>Description:</strong>{" "}
                        {selectedCategory.metadata.description}
                      </p>
                    )}
                    {selectedCategory.metadata.keywords && (
                      <p>
                        <strong>Keywords:</strong>{" "}
                        {selectedCategory.metadata.keywords.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalEditButton}
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedCategory);
                }}
              >
                ✏️ Edit Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
