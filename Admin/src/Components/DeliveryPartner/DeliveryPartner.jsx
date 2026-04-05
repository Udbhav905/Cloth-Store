import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './DeliveryPartner.module.css';

export default function DeliveryPartner() {
  const [registrationResult, setRegistrationResult] = useState(null);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ status: '', search: '', page: 1 });
  const [pagination, setPagination] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
    vehicleType: 'bike',
    vehicleNumber: '',
    licenseNumber: '',
    aadharNumber: '',
    bankDetails: { accountNumber: '', ifscCode: '', bankName: '', accountHolderName: '' }
  });

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Fetch partners from API
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      
      const response = await axios.get(`/api/delivery-partners?${params}`, getAuthConfig());
      setPartners(response.data.data);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch delivery partners');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/delivery-partners/stats', getAuthConfig());
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchPartners();
    fetchStats();
  }, [filters]);

  // Register partner via API
  // Register partner via API
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post('/api/delivery-partners/register', formData, getAuthConfig());
    setShowModal(false);
    resetForm();
    fetchPartners();
    fetchStats();
    
    // Show success message with credentials
    if (response.data.data && response.data.data.defaultPassword) {
      alert(`Delivery partner registered successfully!\n\nLogin Credentials:\nEmail: ${formData.email}\nPassword: ${response.data.data.defaultPassword}\n\nPlease share these credentials with the delivery partner.`);
    } else {
      alert('Delivery partner registered successfully!');
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to register');
  }
};

  // Update status via API
  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`/api/delivery-partners/${id}/status`, { status }, getAuthConfig());
      fetchPartners();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Delete via API
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axios.delete(`/api/delivery-partners/${id}`, getAuthConfig());
        fetchPartners();
        fetchStats();
        alert('Deleted successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', companyName: '',
      address: { street: '', city: '', state: '', pincode: '', country: 'India' },
      vehicleType: 'bike', vehicleNumber: '', licenseNumber: '', aadharNumber: '',
      bankDetails: { accountNumber: '', ifscCode: '', bankName: '', accountHolderName: '' }
    });
  };

  const handleInputChange = (e, section, field) => {
    if (section) {
      setFormData({ ...formData, [section]: { ...formData[section], [field]: e.target.value } });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'inactive': return styles.statusInactive;
      case 'suspended': return styles.statusSuspended;
      default: return styles.statusPending;
    }
  };

  const getVehicleIcon = (type) => {
    const icons = { bike: '🏍️', car: '🚗', truck: '🚚', van: '🚐', auto: '🛺' };
    return icons[type] || '🚚';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Delivery Partners</h1>
          <p className={styles.subtitle}>Manage your delivery fleet</p>
        </div>
        <button className={styles.addButton} onClick={() => { resetForm(); setShowModal(true); }}>
          <span className={styles.addIcon}>+</span> Add New Partner
        </button>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}><h3>{stats.total}</h3><p>Total Partners</p></div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}><h3>{stats.active}</h3><p>Active</p></div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}><h3>{stats.pending}</h3><p>Pending</p></div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🚚</div>
            <div className={styles.statInfo}><h3>{(stats.totalDeliveries || 0).toLocaleString()}</h3><p>Total Deliveries</p></div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <input type="text" placeholder="Search by name, email, phone..." className={styles.searchInput}
          value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        <select className={styles.filterSelect} value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner}></div><p>Loading...</p></div>
      ) : error ? (
        <div className={styles.error}><p>⚠️ {error}</p><button onClick={fetchPartners} className={styles.retryBtn}>Retry</button></div>
      ) : partners.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚚</div>
          <h3>No delivery partners found</h3>
          <p>Click "Add New Partner" to register your first delivery partner</p>
        </div>
      ) : (
        <div className={styles.partnersGrid}>
          {partners.map((partner) => (
            <div key={partner._id} className={styles.partnerCard}>
              <div className={styles.cardHeader}>
                <div className={styles.partnerInfo}>
                  <div className={styles.avatar}>{partner.name.charAt(0).toUpperCase()}</div>
                  <div><h3 className={styles.partnerName}>{partner.name}</h3><p className={styles.companyName}>{partner.companyName}</p></div>
                </div>
                <span className={`${styles.statusBadge} ${getStatusBadge(partner.status)}`}>{partner.status}</span>
              </div>
              <div className={styles.cardDetails}>
                <div className={styles.detailRow}><span className={styles.detailIcon}>📧</span><span>{partner.email}</span></div>
                <div className={styles.detailRow}><span className={styles.detailIcon}>📞</span><span>{partner.phone}</span></div>
                <div className={styles.detailRow}><span className={styles.detailIcon}>{getVehicleIcon(partner.vehicleType)}</span><span>{partner.vehicleType.toUpperCase()} - {partner.vehicleNumber}</span></div>
                <div className={styles.detailRow}><span className={styles.detailIcon}>📍</span><span>{partner.address.city}, {partner.address.state}</span></div>
                <div className={styles.detailRow}><span className={styles.detailIcon}>⭐</span><span>{partner.rating?.toFixed(1) || '0.0'} ({partner.totalDeliveries || 0} deliveries)</span></div>
              </div>
              <div className={styles.cardActions}>
                <select value={partner.status} onChange={(e) => handleStatusChange(partner._id, e.target.value)} className={styles.statusSelect}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                  <option value="pending">Pending</option><option value="suspended">Suspended</option>
                </select>
                <button onClick={() => handleDelete(partner._id)} className={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })} disabled={filters.page === 1} className={styles.pageBtn}>Previous</button>
          <span className={styles.pageInfo}>Page {filters.page} of {pagination.totalPages}</span>
          <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })} disabled={filters.page === pagination.totalPages} className={styles.pageBtn}>Next</button>
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Register New Delivery Partner</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formSection}>
                <h3>Personal Information</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}><label>Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
                  <div className={styles.formGroup}><label>Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required /></div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}><label>Phone *</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required /></div>
                  <div className={styles.formGroup}><label>Company Name *</label><input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} required /></div>
                </div>
              </div>
              <div className={styles.formSection}>
                <h3>Address Details</h3>
                <div className={styles.formRow}><div className={styles.formGroup}><label>Street *</label><input type="text" value={formData.address.street} onChange={(e) => handleInputChange(e, 'address', 'street')} required /></div></div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}><label>City *</label><input type="text" value={formData.address.city} onChange={(e) => handleInputChange(e, 'address', 'city')} required /></div>
                  <div className={styles.formGroup}><label>State *</label><input type="text" value={formData.address.state} onChange={(e) => handleInputChange(e, 'address', 'state')} required /></div>
                </div>
                <div className={styles.formRow}><div className={styles.formGroup}><label>Pincode *</label><input type="text" value={formData.address.pincode} onChange={(e) => handleInputChange(e, 'address', 'pincode')} required /></div></div>
              </div>
              <div className={styles.formSection}>
                <h3>Vehicle Information</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}><label>Vehicle Type *</label><select value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })} required><option value="bike">Bike</option><option value="car">Car</option><option value="truck">Truck</option><option value="van">Van</option><option value="auto">Auto Rickshaw</option></select></div>
                  <div className={styles.formGroup}><label>Vehicle Number *</label><input type="text" value={formData.vehicleNumber} onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })} required /></div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}><label>License Number *</label><input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} required /></div>
                  <div className={styles.formGroup}><label>Aadhar Number *</label><input type="text" value={formData.aadharNumber} onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })} required /></div>
                </div>
              </div>
              <div className={styles.formSection}>
                <h3>Bank Details</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}><label>Account Number *</label><input type="text" value={formData.bankDetails.accountNumber} onChange={(e) => handleInputChange(e, 'bankDetails', 'accountNumber')} required /></div>
                  <div className={styles.formGroup}><label>IFSC Code *</label><input type="text" value={formData.bankDetails.ifscCode} onChange={(e) => handleInputChange(e, 'bankDetails', 'ifscCode')} required /></div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}><label>Bank Name *</label><input type="text" value={formData.bankDetails.bankName} onChange={(e) => handleInputChange(e, 'bankDetails', 'bankName')} required /></div>
                  <div className={styles.formGroup}><label>Account Holder Name *</label><input type="text" value={formData.bankDetails.accountHolderName} onChange={(e) => handleInputChange(e, 'bankDetails', 'accountHolderName')} required /></div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Register Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}