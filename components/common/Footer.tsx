import { MailIcon, PhoneIcon } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer 
      className="py-12 px-6 border-t border-white/30"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)'
      }}
    >
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 text-center md:text-left">

        {/* Returns & Shipping */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-gray-900 drop-shadow-sm">Customer Care</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/returns" className="text-gray-700 hover:text-pink-600 transition-colors">Returns</Link></li>
            <li><Link href="/shipping" className="text-gray-700 hover:text-pink-600 transition-colors">Shipping</Link></li>
            <li><Link href="/faq" className="text-gray-700 hover:text-pink-600 transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* Contact Us / Help */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-gray-900 drop-shadow-sm">Reach Out</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/contact" className="text-gray-700 hover:text-pink-600 transition-colors">Contact Us</Link></li>
            <li className="flex items-center justify-center md:justify-start">
                <MailIcon className="h-4 w-4 mr-2 text-pink-600" />
                <span className="text-gray-700">boutique.fatima25@gmail.com</span>
            </li>
            <li className="flex items-center justify-center md:justify-start">
                <PhoneIcon className="h-4 w-4 mr-2 text-pink-600" />
                <span className="text-gray-700">+91 78976 91947</span>
            </li>
          </ul>
        </div>

        {/* Store Locator & Legal */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-gray-900 drop-shadow-sm">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/store-locator" className="text-gray-700 hover:text-pink-600 transition-colors">Store Locator</Link></li>
            <li><Link href="/legal" className="text-gray-700 hover:text-pink-600 transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/legal/privacy" className="text-gray-700 hover:text-pink-600 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/about" className="text-gray-700 hover:text-pink-600 transition-colors">About Us</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center mt-12 text-sm text-gray-600 border-t border-white/30 pt-8">
        &copy; {new Date().getFullYear()} Fatima Boutique. All rights reserved.
      </div>
    </footer>
  );
}