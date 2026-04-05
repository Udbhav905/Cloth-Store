import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const partner = JSON.parse(localStorage.getItem('partnerData') || '{}');

  const stats = [
    { label: 'Total Deliveries', value: partner.totalDeliveries || 0, icon: '📦' },
    { label: 'Rating', value: `${partner.rating || 0} ★`, icon: '⭐' },
    { label: 'Total Earnings', value: `₹${partner.totalEarnings || 0}`, icon: '💰' },
    { label: 'Vehicle Type', value: partner.vehicleType?.toUpperCase() || 'N/A', icon: '🚗' },
  ];

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View your profile information and statistics</p>
      </div>

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {partner.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>
          <div className="profile-info">
            <h2>{partner.name || 'Delivery Partner'}</h2>
            <p className="company">{partner.companyName}</p>
            <div className="contact-info">
              <span>📧 {partner.email}</span>
              <span>📞 {partner.phone}</span>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h3>Performance Stats</h3>
          <div className="stats-profile-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-profile-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-details">
                  <h4>{stat.value}</h4>
                  <p>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vehicle-section">
          <h3>Vehicle Information</h3>
          <div className="vehicle-details">
            <div className="detail-row">
              <span className="label">Vehicle Type:</span>
              <span>{partner.vehicleType?.toUpperCase() || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Vehicle Number:</span>
              <span>{partner.vehicleNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="account-section">
          <h3>Account Status</h3>
          <div className="status-badge-profile active">
            Active Partner
          </div>
          <p className="note">Contact admin for any account-related queries</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;