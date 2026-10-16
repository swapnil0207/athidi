export default function StoreHeader() {
  return <header className="store-header"><div className="store-container store-nav">
    <a href="/" aria-label="Athidi Foods home"><img className="store-logo" src="/assets/Athidi Foods Logo with Steaming Bowl.png" alt="Athidi Foods" /></a>
    <span className="store-veg"><span aria-hidden="true">▣</span> 100% Pure Veg</span>
    <a className="store-contact" href="https://wa.me/919618634908" target="_blank" rel="noopener noreferrer">Let’s talk <span aria-hidden="true">↗</span></a>
  </div></header>;
}
