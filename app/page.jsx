import { pageMetadata } from '../lib/seo';
import { categories } from '../lib/categories';

export const metadata = pageMetadata('/');

export default function HomePage() {
  return <div className="store-section">
    
    <main className="store-container">
      <div className="store-intro">
        <span className="store-eyebrow">ADONI’S OWN FOOD STORE</span>
        <h1>A little of everything.<br /><em>A whole lot of home.</em></h1>
        <p>Pick what you’re craving.</p>
      </div>
      <nav className="category-list" aria-label="Our food categories">
        {categories.map((category, index) => <a key={category.slug} href={category.href} className={`category-banner category-${category.slug}`} aria-label={category.title}>
          <div className="category-copy">
            <span className="category-topline"><span className="category-number">0{index + 1}</span><span className={`category-status${category.soon ? ' is-soon' : ''}`}>{category.soon ? 'COMING SOON' : category.label}</span></span>
            <h2>{category.title}</h2><p>{category.description}</p>
            <span className="category-action">{category.action}<span className="category-arrow" aria-hidden="true">↗</span></span>
          </div>
          <div className="category-photo"><img src={category.image} alt={category.alt} loading={index < 2 ? 'eager' : 'lazy'} /></div>
        </a>)}
      </nav>
    </main>
    
  </div>;
}
