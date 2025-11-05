// app/products/page.tsx
import { ProductCatalog } from '@/components/ProductCatalog';
import { Suspense } from 'react';

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading products…</div>}>
            <ProductCatalog />
        </Suspense>
    )
}