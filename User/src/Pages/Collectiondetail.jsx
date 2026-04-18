import React from 'react'
import { useParams } from 'react-router-dom'
import styles from '../Pages/styles/Page.module.css'

const toLabel = (slug) =>
  slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const CollectionDetail = () => {
  const { slug } = useParams()

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>◆ Collections</p>
        <h1 className={styles.title}>{toLabel(slug)}</h1>
        <p className={styles.sub}>
          Curated pieces from the {toLabel(slug)} collection.
        </p>
      </div>
    </main>
  )
}

export default CollectionDetail