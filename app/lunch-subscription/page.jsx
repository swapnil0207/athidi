import { pageMetadata } from '../../lib/seo';
export const metadata = pageMetadata('/lunch-subscription');

export default function LunchSubscriptionPage() { return <div className="home-page">



  <main>
    <a className="weekend-order-promo" href="/biryani-curries" aria-label="Order food for the weekend">
      <div className="container weekend-order-inner">
        <div className="weekend-order-icon" aria-hidden="true">🍛</div>
        <div className="weekend-order-copy">
          <span className="weekend-order-kicker">WEEKEND SPECIALS</span>
          <h2>Craving something delicious this weekend?</h2>
          <p>Explore our menu, choose your favourites, and order fresh food for the weekend.</p>
        </div>
        <span className="weekend-order-cta">Order food <span aria-hidden="true">→</span></span>
      </div>
    </a>

    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">HOME-STYLE MEALS • EVERY DAY</div>
          <h1>Good Food.<br /><em>Good Health.</em><br />Happier You.</h1>
          <p className="hero-text">
            Fresh, home-style lunch prepared with care and delivered for
            working professionals, students and families.
          </p>

          <div className="launch-card">
            <div className="launch-icon">🚀</div>
            <div>
              <strong>We're launching soon!</strong>
              <p>Our online ordering and subscription features are being prepared.</p>
            </div>
          </div>

          <div className="price-row" id="contact">
            <div className="price-card featured">
              <span>Monthly Lunch Subscription</span>
              <b>₹2,400</b>
              <small>26 lunches</small>
            </div>
            <div className="price-card">
              <span>Weekday Plan</span>
              <b>₹500</b>
              <small>5 lunches • Mon–Fri</small>
            </div>
          </div>

          <div className="actions">
            <a className="btn whatsapp" href="https://wa.me/919618634908?text=Hi%20Athidi%20Foods%2C%20I%20am%20interested%20in%20the%20lunch%20subscription.%20Please%20share%20the%20details." target="_blank" rel="noopener">
              <span>◉</span> WhatsApp to Subscribe
            </a>
            <a className="btn call" href="tel:+919618634908">
              <span>☎</span> Call Now
            </a>
          </div>

          <p className="micro-note">📍 NGO Colony, Adoni (Near Children's Park)</p>
        </div>

        <div className="hero-visual">
          <div className="leaf leaf-one">✦</div>
          <div className="image-frame">
            <img src="/assets/athidi-food.jpeg" alt="Athidi Foods home-style lunch subscription" />
          </div>
        </div>
      </div>
    </section>

    <section className="features">
      <div className="container">
        <div className="section-heading">
          <span>WHY ATHIDI?</span>
          <h2>Simple food. Thoughtfully prepared.</h2>
        </div>
        <div className="feature-grid">
          <article className="feature">
            <div className="feature-icon">🌿</div>
            <h3>Fresh Ingredients</h3>
            <p>Meals made with everyday ingredients and a home-style approach.</p>
          </article>
          <article className="feature">
            <div className="feature-icon">♡</div>
            <h3>Nutritious & Balanced</h3>
            <p>A practical lunch option for a busy working day.</p>
          </article>
          <article className="feature">
            <div className="feature-icon">♨</div>
            <h3>Hygienically Prepared</h3>
            <p>Prepared with attention to cleanliness and consistency.</p>
          </article>
          <article className="feature">
            <div className="feature-icon">⌂</div>
            <h3>Home-style Taste</h3>
            <p>Comfort-food inspired meals that feel familiar and satisfying.</p>
          </article>
        </div>
      </div>
    </section>

    <section className="coming-soon">
      <div className="container coming-inner">
        <div className="coming-icon">⏳</div>
        <div>
          <span className="section-kicker">COMING SOON</span>
          <h2>More features are being cooked up.</h2>
          <p>
            Online subscription management, easier menu selection, delivery updates
            and more will be added soon. For now, WhatsApp or call us directly to subscribe.
          </p>
        </div>
        <a className="btn whatsapp compact" href="https://wa.me/919618634908?text=Hi%20Athidi%20Foods%2C%20I%20am%20interested%20in%20the%20lunch%20subscription.%20Please%20share%20the%20details." target="_blank" rel="noopener">Message on WhatsApp</a>
      </div>
    </section>
  </main>



</div>; }
