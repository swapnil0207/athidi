import { menu } from './menu';

export const demoShops = [
  { id: 'lunch', name: 'Lunch Subscription', login: 'lunch.demo', image: '/assets/banners/lunch.webp', products: [{ name: 'Home-style lunch', price: 100 }, { name: 'Weekday lunch plan', price: 500 }, { name: 'Monthly lunch plan', price: 2400 }] },
  { id: 'biryani', name: 'Biryani & Curries', login: 'biryani.demo', image: '/assets/banners/biryani.webp', products: menu },
  { id: 'sweets', name: 'Sweets', login: 'sweets.demo', image: '/assets/banners/sweets.webp', products: [{ name: 'Motichoor laddu · 500 g', price: 240 }, { name: 'Kaju katli · 250 g', price: 280 }, { name: 'Gulab jamun · 6 pieces', price: 150 }] },
  { id: 'bakery', name: 'Bakery', login: 'bakery.demo', image: '/assets/banners/bakery.webp', products: [{ name: 'Chocolate cake · 500 g', price: 450 }, { name: 'Butter cookies · 250 g', price: 160 }, { name: 'Fresh bread loaf', price: 60 }] },
  { id: 'dry-fruits', name: 'Dry Fruits', login: 'dryfruits.demo', image: '/assets/banners/dry-fruits.webp', products: [{ name: 'Almonds · 250 g', price: 240 }, { name: 'Cashews · 250 g', price: 280 }, { name: 'Dates · 500 g', price: 220 }] },
];

export const demoPassword = 'Preview123'; // Public demo only; never use for real authentication.
export const demoSessionKey = 'athidi-shop-preview-session-v1';
export const demoDataKey = id => `athidi-shop-preview-v1-${id}`;
export const statusLabels = { received: 'Received', inprogress: 'In progress', sent: 'Sent', delivered: 'Delivered' };
export const formatMoney = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
export const currentMonth = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };

export function createDemoData(shop) {
  const now = new Date();
  const date = `${currentMonth()}-${String(now.getDate()).padStart(2, '0')}`;
  const products = shop.products.map((product, index) => ({ id: `${shop.id}-${index}`, name: product.name, price: product.price, image: product.file || shop.image, available: index !== 2 }));
  return {
    version: 1, open: true, reopensAt: '', notice: '', products,
    orders: ['received', 'received', 'inprogress', 'sent', 'delivered', 'delivered'].map((status, index) => {
      const product = products[index % products.length];
      const quantity = index % 2 + 1;
      return { id: `${shop.id.toUpperCase()}-${1041 + index}`, date, customer: `Demo customer ${index + 1}`, address: 'Sample delivery address, Adoni', status, tracking: '', items: [{ name: product.name, quantity, price: product.price }], total: product.price * quantity };
    }),
  };
}
