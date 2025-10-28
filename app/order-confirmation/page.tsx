// app/order-confirmation/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function OrderConfirmationIndex({ searchParams }: Props) {
  const orderId = Array.isArray(searchParams?.orderId)
    ? searchParams?.orderId[0]
    : searchParams?.orderId;

  if (orderId) {
    // server-side redirect to the new route
    redirect(`/order-confirmation/${orderId}`);
  }

  // If no orderId present — show a friendly message (server-rendered)
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-2xl font-semibold">No order specified</h1>
        <p className="mt-4 text-sm text-gray-600">If you followed a link, it looks incomplete. Go to <Link href="/" className="text-sky-600 underline">home</Link>.</p>
      </div>
    </div>
  );
}
