import { redirect } from 'next/navigation';

export default function PricingPage() {
  // Pricing is not applicable — redirect to home
  redirect('/');
}
