export default function StoreFooter() {
  return <footer className="store-footer">
    <div className="store-container">
      <div className="footer-details">
        <div className="footer-brand">
          <a href="/" aria-label="Athidi Foods home">Athidi<span>FOODS</span></a>
          <p>Home-style taste. Every day.</p>
          <span className="footer-veg">100% Pure Veg</span>
        </div>
        <div className="footer-contact-details">
          <h2>Let’s talk</h2>
          <a className="footer-phone" href="tel:+919618634908">96186 34908</a>
          <a className="footer-whatsapp" href="https://wa.me/919618634908" target="_blank" rel="noopener noreferrer">Chat on WhatsApp <span aria-hidden="true">↗</span></a>
        </div>
        <div className="footer-location">
          <h2>Made with love in Adoni</h2>
          <address>Plot No. 46, NGO Colony<br />Near Children’s Park<br />Adoni, Andhra Pradesh</address>
          <a className="footer-directions" href="https://www.google.com/maps/search/?api=1&query=Plot+No.+46+NGO+Colony+Near+Children%27s+Park+Adoni+Andhra+Pradesh" target="_blank" rel="noopener noreferrer">Find us on the map <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Athidi Foods</span>
        <a href="/sitemap.html">Explore all pages</a>
        <a href="/dashboard/login">Shop login</a>
        <a href="/dashboard/customer/login">Customer login</a>
        <a href="/dashboard/admin/login">Admin login</a>
        <span className="footer-license"><span>FSSAI Lic. No.</span> 20126192001203</span>
      </div>
    </div>
  </footer>;
}
