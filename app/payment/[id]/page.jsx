import PaymentResult from '../../../components/PaymentResult';

export const metadata = { title: 'Payment status | Athidi Foods', alternates: { canonical: null }, openGraph: null, twitter: null, robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function PaymentPage({ params }) {
  const { id } = await params;
  return <PaymentResult orderId={id} />;
}
