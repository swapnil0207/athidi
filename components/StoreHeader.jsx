import InstallButton from './InstallButton';

export default function StoreHeader() {
  return <header className="store-header"><div className="store-container store-nav">
    <a href="/" aria-label="Athidi Foods home"><img className="store-logo" src="/assets/Athidi Foods Logo with Steaming Bowl.png" alt="Athidi Foods" /></a>
    <span className="store-veg"><span aria-hidden="true">▣</span> 100% Pure Veg</span>
    <div className="store-nav-actions"><InstallButton /></div>
  </div></header>;
}
