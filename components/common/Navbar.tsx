"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Menu from '@mui/material/Menu';
import { easeOut, motion } from "framer-motion";
import { Heart, LogOut, Menu as MenuIcon, Search, Settings, ShoppingCart, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchModal } from "../modals/MobileSearchModal";
import { SearchBar } from "../modals/SearchModal";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";

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

  // Enhanced animation variants with proper TypeScript types
  const navContainerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: easeOut,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const navItemVariants = {
    hidden: { 
      opacity: 0, 
      y: -20,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  const logoVariants = {
    hidden: { 
      opacity: 0, 
      x: -30 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20,
        duration: 0.8
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    }
  };

  const underlineVariants = {
    hidden: { width: 0 },
    hover: { 
      width: "100%",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    }
  };

  const mobileMenuVariants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const mobileItemVariants = {
    closed: { 
      opacity: 0, 
      x: -20 
    },
    open: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
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

  // Common hover styles for consistency
  const hoverStyles = "hover:bg-white/20 hover:text-pink-600 transition-all duration-200";
  const mobileHoverStyles = "active:bg-white/20 active:text-pink-600 transition-all duration-200";

  // Navigation items for mobile menu
  const mobileNavItems = [
    {
      href: "/wishlist",
      icon: Heart,
      label: "Wishlist",
      show: true
    },
    {
      href: "/account/profile",
      icon: User,
      label: "Profile",
      show: isSignedIn
    },
    {
      href: "/account/orders",
      icon: Settings,
      label: "Orders",
      show: isSignedIn
    },
  ];

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={navContainerVariants}
        className={`sticky top-0 z-50 bg-white/20 backdrop-blur-2xl border-white/30 transition-all duration-300 ${
          isScrolled ? 'shadow-lg shadow-black/10 py-2' : 'shadow-md shadow-black/5 py-3'
        } border-b`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            {/* Logo - Enhanced with better formatting */}
            <motion.div 
              variants={logoVariants}
              whileHover="hover"
              className="flex-shrink-0"
            >
              <Link
                href="/"
                className="group flex flex-col items-start hover:no-underline transition-all duration-300"
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-light text-gray-900 tracking-widest font-serif italic">
                    Fatima
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-[-4px]">
                  <span className="text-sm font-medium text-pink-600 tracking-[0.3em] uppercase font-sans">
                    Boutique
                  </span>
                </div>
                {/* Elegant underline effect on hover */}
                <motion.div 
                  className="h-0.5 bg-gradient-to-r from-pink-500 to-pink-300 mt-1"
                  variants={underlineVariants}
                  initial="hidden"
                  whileHover="hover"
                />
              </Link>
            </motion.div>
            
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
                {/* Wishlist - Now consistent across both views */}
                <motion.div variants={navItemVariants}>
                  <Link href="/wishlist">
                    <motion.div
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 ${hoverStyles}`}
                        aria-label="Wishlist"
                      >
                        <Heart className="w-4 h-4"/>
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>

                {/* User Menu with Material-UI */}
                <motion.div variants={navItemVariants}>
                  {isSignedIn ? (
                    <>
                      <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                      >
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 ${hoverStyles}`}
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
                      </motion.div>
                      <Menu
                        id="user-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        onClick={handleClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{
                          elevation: 0,
                          sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 8px 32px rgba(0,0,0,0.1))',
                            mt: 1.5,
                            minWidth: 220,
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            '& .MuiMenuItem-root': {
                              fontSize: '0.875rem',
                              padding: '12px 16px',
                              '&:hover': {
                                backgroundColor: 'rgba(253, 242, 248, 0.8)',
                                color: 'rgb(219, 39, 119)',
                              },
                            },
                            '& .MuiDivider-root': {
                              margin: '8px 0',
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            },
                          },
                        }}
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200/50">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.fullName || user?.username || "User"}
                            </p>
                            <p className="text-xs text-gray-600">
                              {user?.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </div>

                        <MenuItem component={Link} href="/account/profile" onClick={handleClose}>
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
                      <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                      >
                        <Link href="/sign-in">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-gray-700 text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 ${hoverStyles}`}
                          >
                            Sign In
                          </Button>                    
                        </Link>
                      </motion.div>
                      <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                      >
                        <Link href='/sign-up'>
                          <Button
                            size="sm"
                            className="bg-pink-600/90 hover:bg-pink-700/90 text-white text-sm font-medium backdrop-blur-sm border border-pink-500/30"
                          >
                            Sign Up
                          </Button>                
                        </Link>
                      </motion.div>  
                    </div>
                  )}
                </motion.div>

                {/* Cart */}
                <motion.div variants={navItemVariants}>
                  <Link href="/cart">
                    <motion.div
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                    >
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`w-9 h-9 rounded-lg relative bg-white/10 backdrop-blur-sm border border-white/20 ${hoverStyles}`}
                        aria-label="Shopping cart"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </motion.div>
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
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 ${hoverStyles} ${mobileHoverStyles}`}
                    >
                      <MenuIcon className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  className="w-80 p-0 border-r border-white/30"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)'
                  }}
                >
                  <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                  <motion.div 
                    className="flex flex-col h-full"
                    initial="closed"
                    animate="open"
                    variants={mobileMenuVariants}
                  >
                    {/* Header */}
                    <motion.div 
                      className="flex items-center justify-between p-4 border-b border-white/30"
                      variants={mobileItemVariants}
                    >
                      <Link 
                        href="/" 
                        className="group flex flex-col items-start hover:no-underline"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-light text-gray-900 tracking-widest font-serif italic">
                            Fatima
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-[-2px]">
                          <span className="text-xs font-medium text-pink-600 tracking-[0.3em] uppercase font-sans">
                            Boutique
                          </span>
                        </div>
                      </Link>
                    </motion.div>

                    {/* User Info */}
                    {isSignedIn && user && (
                      <motion.div 
                        className="p-4 border-b border-white/30 bg-white/20"
                        variants={mobileItemVariants}
                      >
                        <div className="flex items-center space-x-3">
                          {user?.imageUrl ? (
                            <Image
                              width={40}
                              height={40}
                              src={user.imageUrl}
                              alt={user.fullName || "User"}
                              className="w-8 h-8 rounded-full object-cover border border-white/30"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-pink-100/50 flex items-center justify-center border border-white/30">
                              <User className="w-4 h-4 text-pink-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.fullName || user.username}
                            </p>
                            <p className="text-xs text-gray-700 truncate">
                              {user.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation Items */}
                    <div className="flex-1 p-4 space-y-2">
                      {mobileNavItems.map((item, index) => 
                        item.show && (
                          <motion.div
                            key={item.href}
                            variants={mobileItemVariants}
                            custom={index}
                          >
                            <Link 
                              href={item.href} 
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block"
                            >
                              <motion.div
                                whileHover="hover"
                                whileTap="tap"
                                variants={buttonVariants}
                              >
                                <Button
                                  variant="outline"
                                  className={`
                                    w-full justify-start 
                                    bg-white/10 backdrop-blur-sm border border-white/20
                                    ${hoverStyles} ${mobileHoverStyles}
                                  `}
                                >
                                  <item.icon className="mr-3 w-4 h-4" />
                                  {item.label}
                                </Button>
                              </motion.div>
                            </Link>
                          </motion.div>
                        )
                      )}
                    </div>

                    {/* Auth Section */}
                    <motion.div 
                      className="p-4 border-t border-white/30 bg-white/20"
                      variants={mobileItemVariants}
                    >
                      {isSignedIn ? (
                        <motion.div
                          whileHover="hover"
                          whileTap="tap"
                          variants={buttonVariants}
                        >
                          <Button
                            onClick={() => {
                              handleSignOut();
                              setIsMobileMenuOpen(false);
                            }}
                            variant="outline"
                            className={`
                              w-full justify-start text-red-600 border-red-200/50 
                              bg-white/10 backdrop-blur-sm
                              hover:bg-red-50/50 hover:text-red-700
                              active:bg-red-100/50 active:text-red-800
                            `}
                          >
                            <LogOut className="mr-3 w-4 h-4" />
                            Sign Out
                          </Button>
                        </motion.div>
                      ) : (
                        <div className="space-y-2">
                          <motion.div
                            whileHover="hover"
                            whileTap="tap"
                            variants={buttonVariants}
                          >
                            <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                              <Button 
                                variant="outline" 
                                className={`
                                  w-full 
                                  bg-white/10 backdrop-blur-sm border border-white/20
                                  ${hoverStyles} ${mobileHoverStyles}
                                `}
                              >
                                Sign In
                              </Button>
                            </Link>
                          </motion.div>
                          <motion.div
                            whileHover="hover"
                            whileTap="tap"
                            variants={buttonVariants}
                          >
                            <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                              <Button 
                                className={`
                                  w-full bg-pink-600/90 hover:bg-pink-700/90 text-white
                                  backdrop-blur-sm border border-pink-500/30
                                `}
                              >
                                Sign Up
                              </Button>
                            </Link>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                </SheetContent>
              </Sheet>
            </motion.div>

            {/* Mobile Logo */}
            <motion.div 
              variants={logoVariants}
              whileHover="hover"
            >
              <Link
                href="/"
                className="group flex flex-col items-start hover:no-underline"
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-light text-gray-900 tracking-widest font-serif italic">
                    Fatima
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-[-2px]">
                  <span className="text-xs font-medium text-pink-600 tracking-[0.3em] uppercase font-sans">
                    Boutique
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Mobile Right Actions */}
            <div className="flex items-center space-x-1">
              {/* Wishlist - Now consistent with desktop */}
              <motion.div variants={navItemVariants}>
                <Link href="/wishlist">
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 ${hoverStyles} ${mobileHoverStyles}`}
                      aria-label="Wishlist"
                    >
                      <Heart className="w-4 h-4"/>
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Search Button */}
              <motion.div variants={navItemVariants}>
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 ${hoverStyles} ${mobileHoverStyles}`}
                    onClick={() => setIsSearchModalOpen(true)}
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Cart */}
              <motion.div variants={navItemVariants}>
                <Link href="/cart">
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`w-9 h-9 rounded-lg relative bg-white/10 backdrop-blur-sm border border-white/20 ${hoverStyles} ${mobileHoverStyles}`}
                      aria-label="Shopping cart"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </motion.div>
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