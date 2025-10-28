"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Menu from '@mui/material/Menu';
import { motion } from "framer-motion";
import { Heart, LogOut, Menu as MenuIcon, Search, Settings, ShoppingCart, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchModal } from "../modals/MobileSearchModal";
import { SearchBar } from "../modals/SearchModal";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

// Material-UI Components
import { Divider, ListItemIcon, ListItemText } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';

export function Navbar() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Material-UI Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      handleClose();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Material-UI Menu handlers
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Navigation items for consistent structure
  const navItems = [
    { href: "/shop", label: "Shop" },
    { href: "/shop/dresses", label: "Dresses" },
    { href: "/shop/new-arrivals", label: "New Arrivals" },
  ];

  const mobileMenuItems = [
    ...navItems,
    { href: "/account/orders", label: "Orders" },
    { href: "/wishlist", label: "Wishlist" },
  ];

  // Common hover styles for consistency
  const hoverStyles = "hover:bg-pink-50 hover:text-pink-600 transition-all duration-200";
  const mobileHoverStyles = "active:bg-pink-50 active:text-pink-600 transition-all duration-200";

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-lg transition-all duration-300 ${
          isScrolled ? 'shadow-md py-2' : 'shadow-sm py-3'
        } border-b border-gray-100`}
      >
        <div className="container mx-auto px-4 md:px-6">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            {/* Logo */}
            <motion.div variants={navItemVariants} className="flex-shrink-0">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 hover:text-pink-600 transition-colors font-serif tracking-tight"
              >
                Fatima Boutique
              </Link>
            </motion.div>

            {/* Navigation Links - Center */}
            <div className="flex items-center space-x-6 text-sm font-medium text-gray-700">
              {navItems.map((item) => (
                <motion.div key={item.href} variants={navItemVariants}>
                  <Link 
                    href={item.href} 
                    className="relative py-2 px-1 text-gray-600 hover:text-pink-600 transition-colors group"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Right Side - Search & Actions */}
            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <motion.div variants={navItemVariants} className="w-60">
                <SearchBar 
                  variant="glass" 
                  className="w-full"
                />
              </motion.div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                {/* User Menu with Material-UI */}
                <motion.div variants={navItemVariants}>
                  {isSignedIn ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`w-9 h-9 rounded-lg ${hoverStyles}`}
                        onClick={handleClick}
                        aria-controls={open ? 'user-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                      >
                        {user?.imageUrl ? (
                          <Image
                            width={32}
                            height={32}
                            src={user.imageUrl}
                            alt={user.fullName || "User"}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </Button>
                      <Menu
                        id="user-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        onClick={handleClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{
                          elevation: 3,
                          sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                            mt: 1.5,
                            minWidth: 220,
                            borderRadius: 2,
                            '& .MuiMenuItem-root': {
                              fontSize: '0.875rem',
                              padding: '12px 16px',
                              '&:hover': {
                                backgroundColor: 'rgb(253, 242, 248)',
                                color: 'rgb(219, 39, 119)',
                              },
                            },
                            '& .MuiDivider-root': {
                              margin: '8px 0',
                            },
                          },
                        }}
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.fullName || user?.username || "User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user?.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </div>

                        <MenuItem component={Link} href="/account/profile">
                          <ListItemIcon>
                            <User className="w-4 h-4" />
                          </ListItemIcon>
                          <ListItemText>Profile</ListItemText>
                        </MenuItem>

                        <MenuItem component={Link} href="/account/orders" onClick={handleClose}>
                          <ListItemIcon>
                            <Settings className="w-4 h-4" />
                          </ListItemIcon>
                          <ListItemText>Orders</ListItemText>
                        </MenuItem>

                        <Divider />

                        <MenuItem onClick={handleSignOut} sx={{ color: 'rgb(220, 38, 38)' }}>
                          <ListItemIcon sx={{ color: 'rgb(220, 38, 38)' }}>
                            <LogOut className="w-4 h-4" />
                          </ListItemIcon>
                          <ListItemText>Sign Out</ListItemText>
                        </MenuItem>
                      </Menu>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Link href="/sign-in">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-gray-600 text-sm font-medium ${hoverStyles}`}
                        >
                          Sign In
                        </Button>                    
                      </Link>
                      <Link href='/sign-up'>
                        <Button
                          size="sm"
                          className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium"
                        >
                          Sign Up
                        </Button>                
                      </Link>  
                    </div>
                  )}
                </motion.div>

                {/* Wishlist */}
                <motion.div variants={navItemVariants}>
                  <Link href="/wishlist">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-9 h-9 rounded-lg ${hoverStyles}`}
                      aria-label="Wishlist"
                    >
                      <Heart className="w-4 h-4"/>
                    </Button>
                  </Link>
                </motion.div>

                {/* Cart */}
                <motion.div variants={navItemVariants}>
                  <Link href="/cart">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`w-9 h-9 rounded-lg relative ${hoverStyles}`}
                      aria-label="Shopping cart"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {/* Cart count badge - uncomment when needed */}
                      {/* <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        3
                      </span> */}
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex md:hidden items-center justify-between">
            {/* Mobile Menu Button */}
            <motion.div variants={navItemVariants}>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-9 h-9 rounded-lg ${hoverStyles} ${mobileHoverStyles}`}
                  >
                    <MenuIcon className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  className="w-80 bg-white/95 backdrop-blur-md border-r border-gray-200 p-0"
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <Link 
                        href="/" 
                        className="text-lg font-bold text-gray-900 font-serif hover:text-pink-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Fatima Boutique
                      </Link>
                    </div>

                    {/* User Info */}
                    {isSignedIn && user && (
                      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center space-x-3">
                          {user?.imageUrl ? (
                            <Image
                              width={40}
                              height={40}
                              src={user.imageUrl}
                              alt={user.fullName || "User"}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-pink-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.fullName || user.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Links with Enhanced Mobile Hover */}
                    <nav className="flex-1 p-2">
                      {mobileMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`
                            flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-lg 
                            ${hoverStyles} ${mobileHoverStyles}
                            mx-2 my-1
                            transform transition-all duration-200
                            active:scale-95 active:shadow-inner
                            touch-manipulation
                          `}
                          style={{
                            WebkitTapHighlightColor: 'transparent'
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>

                    {/* Auth Section with Enhanced Mobile Interactions */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                      {isSignedIn ? (
                        <div className="space-y-2">
                          <Button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                            }}
                            variant="outline"
                            className={`
                              w-full justify-start 
                              ${hoverStyles} ${mobileHoverStyles}
                              border-gray-200
                              transform transition-all duration-200
                              active:scale-95
                            `}
                          >
                            <User className="mr-3 w-4 h-4" />
                            Profile
                          </Button>
                          <Button
                            onClick={() => {
                              handleSignOut();
                              setIsMobileMenuOpen(false);
                            }}
                            variant="outline"
                            className={`
                              w-full justify-start text-red-600 border-red-200 
                              hover:bg-red-50 hover:text-red-700
                              active:bg-red-100 active:text-red-800
                              transform transition-all duration-200
                              active:scale-95
                            `}
                          >
                            <LogOut className="mr-3 w-4 h-4" />
                            Sign Out
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button 
                              variant="outline" 
                              className={`
                                w-full 
                                ${hoverStyles} ${mobileHoverStyles}
                                border-gray-200
                                transform transition-all duration-200
                                active:scale-95
                              `}
                            >
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button 
                              className={`
                                w-full bg-pink-600 hover:bg-pink-700 text-white
                                transform transition-all duration-200
                                active:scale-95 active:bg-pink-800
                              `}
                            >
                              Sign Up
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </motion.div>

            {/* Mobile Logo */}
            <motion.div variants={navItemVariants}>
              <Link
                href="/"
                className="text-lg font-bold text-gray-900 font-serif hover:text-pink-600"
              >
                Fatima Boutique
              </Link>
            </motion.div>

            {/* Mobile Right Actions */}
            <div className="flex items-center space-x-1">
              {/* Search Button */}
              <motion.div variants={navItemVariants}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`w-9 h-9 rounded-lg ${hoverStyles} ${mobileHoverStyles}`}
                  onClick={() => setIsSearchModalOpen(true)}
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </motion.div>

              {/* Cart */}
              <motion.div variants={navItemVariants}>
                <Link href="/cart">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-9 h-9 rounded-lg relative ${hoverStyles} ${mobileHoverStyles}`}
                    aria-label="Shopping cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}