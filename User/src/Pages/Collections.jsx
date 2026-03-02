import React from 'react'
import styles from '../Pages/styles/Page.module.css'

const Collections = () => {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>◆ Our Universe</p>
        <h1 className={styles.title}>Collections</h1>
        <p className={styles.sub}>
          Browse every category — from evening couture to resort wear.
        </p>
      </div>
    </main>
  )
}

export default Collections