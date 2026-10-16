import { categories } from '../lib/categories';

export default function ComingSoonPage({ category: slug }) {
  const category = categories.find(item => item.slug === slug);
  return <div className="store-section">
    <main className="store-container coming-page"><a className="store-back" href="/">← Back to home</a>
      <section className={`coming-card category-${slug}`}>
        <img src={category.image} alt={category.alt} className="coming-photo" />
        <div className="coming-copy"><span className="store-eyebrow">COMING SOON</span><h1>{category.title}</h1>
          <p>{slug === 'bakery' ? 'Currently, this site is under baking. Work in progress!' : 'Currently in progress.'}</p>
          <a className="store-home-button" href="/">Explore other favourites <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </main>
  </div>;
}
