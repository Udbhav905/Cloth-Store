import React from 'react'
import { useParams } from 'react-router-dom'
import styles from './Page.module.css'

const ProductDetail = () => {
  const { id } = useParams()

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>◆ Product</p>
        <h1 className={styles.title}>Product #{id}</h1>
        <p className={styles.sub}>
          Full product details, sizing, and imagery go here.
        </p>
      </div>
    </main>
  )
}

export default ProductDetail