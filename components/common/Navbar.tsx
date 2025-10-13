"use client";

import { useCart } from "@/hooks/useCart";
import { SignInButton, SignUpButton, useClerk, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Heart, LogOut, SearchIcon, Settings, ShoppingCartIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function Navbar() {
  const { cartCount } = useCart();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-50 bg-white bg-opacity-90 backdrop-blur-sm shadow-sm py-4 px-6 md:px-10 border-b border-gray-100"
    >
      <div className="container mx-auto flex justify-between items-center">
        <motion.div variants={navItemVariants}>
          <Link
            href="/"
            className="text-3xl font-bold tracking-wider text-gray-900 hover:text-pink-400 transition-colors"
          >
            Fatima Boutique
          </Link>
        </motion.div>

        <div className="hidden md:flex flex-grow justify-center space-x-8 text-sm uppercase font-medium text-gray-700">
          <motion.div variants={navItemVariants}>
            <Link href="/shop" className="hover:text-pink-400 transition-colors">
              Shop
            </Link>
          </motion.div>
          <motion.div variants={navItemVariants}>
            <Link href="/shop/dresses" className="hover:text-pink-400 transition-colors">
              Dresses
            </Link>
          </motion.div>
          <motion.div variants={navItemVariants}>
            <Link href="/shop/new-arrivals" className="hover:text-pink-400 transition-colors">
              New Arrivals
            </Link>
          </motion.div>
        </div>

        <div className="flex items-center space-x-4">
          <motion.div variants={navItemVariants}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-600 hover:bg-gray-50 hover:text-pink-400"
              aria-label="Search"
            >
              <SearchIcon className="w-5 h-5" />
            </Button>
          </motion.div>

          <motion.div variants={navItemVariants}>
            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-600 hover:bg-gray-50 hover:text-pink-400 relative"
                  >
                    {user?.imageUrl ? (
                      <Image
                        width={32}
                        height={32}
                        src={user.imageUrl}
                        alt={user.fullName || "User"}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.fullName || user?.username || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <SignInButton>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:bg-gray-50 hover:text-pink-400 text-sm font-medium"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600 border-gray-300 hover:bg-pink-50 hover:text-pink-400 hover:border-pink-400 text-sm font-medium"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            )}
          </motion.div>

          <motion.div variants={navItemVariants}>
            <Link href="/cart">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:bg-gray-50 hover:text-pink-400 relative"
                aria-label="Shopping cart"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-pink-400 text-white rounded-full text-xs h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={navItemVariants}>
            <Link href="/wishlist">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:bg-gray-50 hover:text-pink-400 relative"
                aria-label="Wishlist">
                  <Heart className="h-5 w-5"/>
                </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
