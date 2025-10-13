// components/CategoryCard.tsx
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface CategoryCardProps {
  id: string;
  name: string;
  slug: string;
  // You might add an icon or image prop here if you have them for categories
  // icon?: React.ElementType;
  // imageUrl?: string;
}

export const CategoryCard = ({ name, slug }: CategoryCardProps) => {
  return (
    <Link
      href={`/categories/${slug}`}
      className="group"
      aria-label={`Shop ${name} category`}
    >
      <div className="relative rounded-xl overflow-hidden transform transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 shadow-md hover:shadow-lg border border-gray-100 bg-white min-h-[140px] flex items-center justify-center p-4">
        {/* Placeholder for category icon/image */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-15 transition-opacity duration-300">
          <Plus className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="relative text-lg font-medium text-gray-900 text-center z-10 font-sans tracking-wide">
          {name}
        </h3>
      </div>
    </Link>
  );
};