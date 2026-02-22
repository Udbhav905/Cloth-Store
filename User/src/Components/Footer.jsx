import React from 'react';
import styles from '../Styles/Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { name: 'New Arrivals', link: '/new-arrivals' },
      { name: 'Designer Collections', link: '/collections' },
      { name: 'Limited Edition', link: '/limited-edition' },
      { name: 'Sale', link: '/sale' },
      { name: 'Gift Cards', link: '/gift-cards' }
    ],
    about: [
      { name: 'Our Story', link: '/about' },
      { name: 'Craftsmanship', link: '/craftsmanship' },
      { name: 'Sustainability', link: '/sustainability' },
      { name: 'Press', link: '/press' },
      { name: 'Careers', link: '/careers' }
    ],
    support: [
      { name: 'Contact Us', link: '/contact' },
      { name: 'Size Guide', link: '/size-guide' },
      { name: 'Shipping & Returns', link: '/shipping' },
      { name: 'FAQ', link: '/faq' },
      { name: 'Track Order', link: '/track-order' }
    ],
    legal: [
      { name: 'Privacy Policy', link: '/privacy' },
      { name: 'Terms of Service', link: '/terms' },
      { name: 'Cookie Policy', link: '/cookies' },
      { name: 'Accessibility', link: '/accessibility' }
    ]
  };

  const socialLinks = [
    { name: 'Instagram', icon: '📷', link: 'https://instagram.com/luxuria' },
    { name: 'Facebook', icon: '📘', link: 'https://facebook.com/luxuria' },
    { name: 'Twitter', icon: '🐦', link: 'https://twitter.com/luxuria' },
    { name: 'Pinterest', icon: '📌', link: 'https://pinterest.com/luxuria' },
    { name: 'YouTube', icon: '▶️', link: 'https://youtube.com/luxuria' }
  ];

  return (
    <footer className={styles.footer}>
      {/* Decorative top border */}
      <div className={styles.footerBorder}>
        <div className={styles.borderGold}></div>
      </div>

      <div className={styles.container}>
        {/* Newsletter Section */}
        <div className={styles.newsletterSection}>
          <div className={styles.newsletterContent}>
            <h3 className={styles.newsletterTitle}>THE LUXURIA EDIT</h3>
            <p className={styles.newsletterText}>
              Subscribe to receive exclusive offers, early access to new collections, and personalized styling tips.
            </p>
            <form className={styles.newsletterForm}>
              <div className={styles.inputGroup}>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className={styles.emailInput}
                  aria-label="Email address"
                />
                <button type="submit" className={styles.subscribeBtn}>
                  <span>Subscribe</span>
                  <span className={styles.btnIcon}>→</span>
                </button>
              </div>
              <label className={styles.consentCheckbox}>
                <input type="checkbox" />
                <span className={styles.checkmark}></span>
                <span className={styles.consentText}>
                  I agree to receive marketing emails and accept the 
                  <a href="/privacy" className={styles.consentLink}> Privacy Policy</a>
                </span>
              </label>
            </form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className={styles.mainFooter}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <div className={styles.brandLogo}>
              <span className={styles.logoText}>LUXURIA</span>
              <div className={styles.logoUnderline}></div>
            </div>
            <p className={styles.brandDescription}>
              Curating the finest in luxury fashion since 2024. Each piece tells a story of exceptional craftsmanship and timeless elegance.
            </p>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                <span>48 Rue de la Paix, Paris, France</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                <span>+33 (0)1 23 45 67 89</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>✉️</span>
                <span>concierge@luxuria.com</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <h4 className={styles.columnTitle}>SHOP</h4>
              <ul className={styles.linkList}>
                {footerLinks.shop.map((link, index) => (
                  <li key={index}>
                    <a href={link.link} className={styles.link}>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h4 className={styles.columnTitle}>ABOUT</h4>
              <ul className={styles.linkList}>
                {footerLinks.about.map((link, index) => (
                  <li key={index}>
                    <a href={link.link} className={styles.link}>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h4 className={styles.columnTitle}>SUPPORT</h4>
              <ul className={styles.linkList}>
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <a href={link.link} className={styles.link}>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h4 className={styles.columnTitle}>LEGAL</h4>
              <ul className={styles.linkList}>
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a href={link.link} className={styles.link}>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Social Media & Payment Methods */}
        <div className={styles.socialPaymentSection}>
          <div className={styles.socialLinks}>
            <h4 className={styles.socialTitle}>FOLLOW US</h4>
            <div className={styles.socialIcons}>
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.link}
                  className={styles.socialIcon}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                >
                  <span className={styles.socialEmoji}>{social.icon}</span>
                  <span className={styles.socialName}>{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* <div className={styles.paymentMethods}>
            <h4 className={styles.paymentTitle}>WE ACCEPT</h4>
            <div className={styles.paymentIcons}>
              <span className={styles.paymentIcon} title="Visa">💳 Visa</span>
              <span className={styles.paymentIcon} title="Mastercard">💳 Mastercard</span>
              <span className={styles.paymentIcon} title="American Express">💳 Amex</span>
              <span className={styles.paymentIcon} title="PayPal">🅿️ PayPal</span>
              <span className={styles.paymentIcon} title="Apple Pay">🍎 Pay</span>
              <span className={styles.paymentIcon} title="Google Pay">📱 Pay</span>
            </div>
          </div> */}
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            <span>© {currentYear} LUXURIA. All rights reserved.</span>
            <span className={styles.separator}>|</span>
            <span>Designed in Paris</span>
          </div>
          <div className={styles.trustBadges}>
            <span className={styles.trustBadge}>🔒 Secure Checkout</span>
            <span className={styles.trustBadge}>✨ Authenticity Guaranteed</span>
            <span className={styles.trustBadge}>🚚 Free Shipping Over $500</span>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        className={styles.backToTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <span className={styles.backToTopIcon}>↑</span>
        <span className={styles.backToTopText}>TOP</span>
      </button>

      {/* Decorative Elements */}
      <div className={styles.decorativeLine1}></div>
      <div className={styles.decorativeLine2}></div>
    </footer>
  );
};

export default Footer;