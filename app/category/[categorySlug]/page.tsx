'use client';

import CategoryPage from '@/components/CategoryPage';
import { useParams } from 'next/navigation';


export default function CategoryPageWrapper() {
    const params = useParams();
    const categorySlug = params.categorySlug as string;

    return <CategoryPage categorySlug={categorySlug} />;
}