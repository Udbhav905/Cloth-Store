import React from 'react'
import styles from './Page.module.css'

export const MyOrders = () => (
  <main className={styles.page}>
    <div className={styles.inner}>
      <p className={styles.eyebrow}>◆ Account</p>
      <h1 className={styles.title}>My Orders</h1>
      <p className={styles.sub}>Track and manage your LUXURIA orders.</p>
    </div>
  </main>
)

export const Wishlist = () => (
  <main className={styles.page}>
    <div className={styles.inner}>
      <p className={styles.eyebrow}>◆ Account</p>
      <h1 className={styles.title}>Wishlist</h1>
      <p className={styles.sub}>Your saved pieces, ready when you are.</p>
    </div>
  </main>
)

export const StyleProfile = () => (
  <main className={styles.page}>
    <div className={styles.inner}>
      <p className={styles.eyebrow}>◆ Account</p>
      <h1 className={styles.title}>Style Profile</h1>
      <p className={styles.sub}>Your personal aesthetic, curated by you.</p>
    </div>
  </main>
)

export const Settings = () => (
  <main className={styles.page}>
    <div className={styles.inner}>
      <p className={styles.eyebrow}>◆ Account</p>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.sub}>Manage your account preferences and security.</p>
    </div>
  </main>
)

export const NotFound = () => (
  <main className={styles.page}>
    <div className={styles.inner}>
      <p className={styles.eyebrow}>◆ 404</p>
      <h1 className={styles.title}>Lost in<br /><em>Elegance</em></h1>
      <p className={styles.sub}>This page doesn't exist — but our collections do.</p>
      <a href="/" className={styles.backBtn}>Return Home</a>
    </div>
  </main>
)