import { MailIcon, PhoneIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-600 py-12 px-6 border-t border-gray-100">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 text-center md:text-left">
        {/* Email Sign Up */}
        <div className="md:col-span-2">
          <h4 className="font-semibold text-lg mb-4 text-gray-900">Join Our Inner Circle</h4>
          <p className="text-sm mb-4">Be the first to know about new collections, exclusive events, and styling inspiration.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-pastel-pink focus:border-pastel-pink outline-none text-gray-800 bg-white"
            />
            <Button className="bg-pastel-lavender text-purple-800 hover:bg-purple-200 transition-colors">Subscribe</Button>
          </div>
        </div>

        {/* Returns & Shipping */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-gray-900">Customer Care</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/returns" className="hover:text-pink-400 transition-colors">Returns</Link></li>
            <li><Link href="/shipping" className="hover:text-pink-400 transition-colors">Shipping</Link></li>
            <li><Link href="/faq" className="hover:text-pink-400 transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* Contact Us / Help */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-gray-900">Reach Out</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/contact" className="hover:text-pink-400 transition-colors">Contact Us</Link></li>
            <li className="flex items-center justify-center md:justify-start">
                <MailIcon className="h-4 w-4 mr-2 text-pastel-pink" />
                <span>boutique.fatima25@gmail.com</span>
            </li>
            <li className="flex items-center justify-center md:justify-start">
                <PhoneIcon className="h-4 w-4 mr-2 text-pastel-pink" />
                <span>+91 75180 13302</span>
            </li>
          </ul>
        </div>

        {/* Store Locator & Legal */}
        <div>
          <h4 className="font-semibold text-lg mb-4 text-gray-900">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/store-locator" className="hover:text-pink-400 transition-colors">Store Locator</Link></li>
            <li><Link href="/legal" className="hover:text-pink-400 transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-pink-400 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/about" className="hover:text-pink-400 transition-colors">About Us</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center mt-12 text-sm text-gray-500 border-t border-gray-200 pt-8">
        &copy; {new Date().getFullYear()} Fatima Botique. All rights reserved.
      </div>
    </footer>
  );
}