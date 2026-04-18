import { useState, useEffect } from "react";
import styles from "./FilterPanel.module.css";
import useApiStore from "../../store/others";
const API = useApiStore.getState().API;
// const API = "http://localhost:3000/api";

const SIZES = ["XS","S","M","L","XL","XXL","28","30","32","34","36","38","40","FREE"];

const PRICE_PRESETS = [
  { label: "Under ₹1,000",         min: "",    max: "1000"  },
  { label: "₹1,000 – ₹5,000",     min: "1000",max: "5000"  },
  { label: "₹5,000 – ₹15,000",    min: "5000",max: "15000" },
  { label: "₹15,000 – ₹50,000",   min: "15000",max:"50000" },
  { label: "Above ₹50,000",        min: "50000",max:""      },
];

/* Collapsible accordion section */
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${styles.section} ${open ? styles.sectionOpen : ""}`}>
      <button className={styles.secHead} onClick={() => setOpen(p => !p)}>
        <span className={styles.secTitle}>{title}</span>
        <svg className={`${styles.secChev} ${open ? styles.secChevUp : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div className={styles.secBody}>{children}</div>}
    </div>
  );
}

export default function FilterPanel({ open, onClose, filters, setParam, toggleArr, clearAll, categoryId }) {
  const [colors,   setColors]   = useState([]);
  const [minInput, setMinInput] = useState(filters.minPrice);
  const [maxInput, setMaxInput] = useState(filters.maxPrice);

  /* Sync local price inputs with URL params */
  useEffect(() => { setMinInput(filters.minPrice); }, [filters.minPrice]);
  useEffect(() => { setMaxInput(filters.maxPrice); }, [filters.maxPrice]);

  /* Fetch unique colors from this category's products */
  useEffect(() => {
    if (!categoryId) return;
    fetch(`${API}/products?category=${categoryId}&limit=100&isActive=true`)
      .then(r => r.json())
      .then(data => {
        const products = data.products || [];
        const colorMap = new Map();
        products.forEach(p =>
          (p.variants || []).forEach(v => {
            if (v.color && v.colorCode && v.isActive !== false)
              colorMap.set(v.color, v.colorCode);
          })
        );
        setColors([...colorMap.entries()].map(([name, code]) => ({ name, code })));
      })
      .catch(() => {});
  }, [categoryId]);

  const applyPrice = () => {
    setParam("minPrice", minInput || null);
    setParam("maxPrice", maxInput || null);
  };

  const activeN = [filters.minPrice, filters.maxPrice,
    ...filters.sizes, ...filters.colors,
    filters.inStock, filters.isNew, filters.isFeatured].filter(Boolean).length;

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className={styles.backdrop} onClick={onClose} aria-hidden="true"/>}

      <aside className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
        {/* Header */}
        <div className={styles.panelHead}>
          <div className={styles.headLeft}>
            <span className={styles.headTitle}>Filters</span>
            {activeN > 0 && <span className={styles.headCount}>{activeN} active</span>}
          </div>
          <div className={styles.headRight}>
            {activeN > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>Clear All</button>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close filters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.panelBody}>

          {/* Quick Flags */}
          <Section title="Quick Filters">
            <div className={styles.toggleRow}>
              {[
                { key: "inStock",    label: "In Stock Only" },
                { key: "isNew",      label: "New Arrivals"  },
                { key: "isFeatured", label: "Featured"      },
              ].map(({ key, label }) => (
                <label key={key} className={`${styles.toggle} ${filters[key] ? styles.toggleOn : ""}`}>
                  <input type="checkbox" checked={!!filters[key]}
                    onChange={() => setParam(key, filters[key] ? null : "true")}/>
                  <span className={styles.toggleTrack}><span className={styles.toggleThumb}/></span>
                  {label}
                </label>
              ))}
            </div>
          </Section>

          {/* Price */}
          <Section title="Price Range">
            <div className={styles.pricePresets}>
              {PRICE_PRESETS.map(pr => {
                const active = filters.minPrice === pr.min && filters.maxPrice === pr.max;
                return (
                  <button key={pr.label}
                    className={`${styles.pricePreset} ${active ? styles.pricePresetOn : ""}`}
                    onClick={() => { setParam("minPrice", pr.min||null); setParam("maxPrice", pr.max||null); }}>
                    {pr.label}
                  </button>
                );
              })}
            </div>
            <div className={styles.priceInputs}>
              <div className={styles.priceField}>
                <span className={styles.priceCur}>₹</span>
                <input type="number" placeholder="Min" value={minInput}
                  className={styles.priceInput}
                  onChange={e => setMinInput(e.target.value)}
                  onBlur={applyPrice} onKeyDown={e => e.key==="Enter" && applyPrice()}/>
              </div>
              <span className={styles.priceDash}>—</span>
              <div className={styles.priceField}>
                <span className={styles.priceCur}>₹</span>
                <input type="number" placeholder="Max" value={maxInput}
                  className={styles.priceInput}
                  onChange={e => setMaxInput(e.target.value)}
                  onBlur={applyPrice} onKeyDown={e => e.key==="Enter" && applyPrice()}/>
              </div>
            </div>
          </Section>

          {/* Sizes */}
          <Section title="Size">
            <div className={styles.sizeGrid}>
              {SIZES.map(s => (
                <button key={s}
                  className={`${styles.sizeChip} ${filters.sizes.includes(s) ? styles.sizeChipOn : ""}`}
                  onClick={() => toggleArr("size", s)}>
                  {s}
                </button>
              ))}
            </div>
          </Section>

          {/* Colors */}
          {colors.length > 0 && (
            <Section title="Colour">
              <div className={styles.colorGrid}>
                {colors.map(c => (
                  <button key={c.name}
                    className={`${styles.colorBtn} ${filters.colors.includes(c.name) ? styles.colorBtnOn : ""}`}
                    onClick={() => toggleArr("color", c.name)}
                    title={c.name}>
                    <span className={styles.colorCircle} style={{ background: c.code }}/>
                    <span className={styles.colorName}>{c.name}</span>
                    {filters.colors.includes(c.name) && (
                      <svg className={styles.colorTick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Availability */}
          <Section title="Availability" defaultOpen={false}>
            <div className={styles.radioGroup}>
              {[
                { v: "",     l: "All Items"    },
                { v: "true", l: "In Stock"     },
              ].map(({ v, l }) => (
                <label key={l} className={`${styles.radio} ${filters.inStock===(v==="true") && (v===""?!filters.inStock:filters.inStock) ? styles.radioOn : ""}`}>
                  <input type="radio" name="stock"
                    checked={v === "" ? !filters.inStock : filters.inStock}
                    onChange={() => setParam("inStock", v || null)}/>
                  <span className={styles.radioMark}/>
                  {l}
                </label>
              ))}
            </div>
          </Section>

        </div>

        {/* Mobile apply button */}
        <div className={styles.panelFoot}>
          <button className={styles.applyBtn} onClick={onClose}>
            Show {`Results`}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}