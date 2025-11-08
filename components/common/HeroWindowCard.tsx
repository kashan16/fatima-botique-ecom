// components/common/HeroWindowCard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { easeInOut, easeOut, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

interface HeroImage {
  id: number;
  src: string;
  title: string;
  subtitle: string;
}

export default function HeroWindowCards({ heroImages }: { heroImages: HeroImage[] }) {
  const router = useRouter();

  const handleNavigate = (path = "/products") => {
    router.push(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent, path = "/products") => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(path);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: easeOut
      }
    }
  };

  const floatVariants = {
    float: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: easeInOut
      }
    }
  };

  // Petal SVG Component
  const PetalSVG: React.FC<{ className?: string; rotate?: number }> = ({ className = "", rotate = 0 }) => (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <path
        d="M32 12C38 8 48 6 52 12C56 18 54 28 50 34C46 40 38 46 32 50C26 46 18 40 14 34C10 28 8 18 12 12C16 6 26 8 32 12Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );

  // Flower SVG Component
  const FlowerSVG: React.FC<{ className?: string }> = ({ className = "" }) => (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.9"/>
      <path d="M32 12L36 24L48 28L36 32L32 44L28 32L16 28L28 24L32 12Z" fill="currentColor" opacity="0.7"/>
    </svg>
  );

  // Geometric Shape Component
  const GeometricShape: React.FC<{ className?: string; type?: "circle" | "triangle" | "diamond" }> = ({ 
    className = "", 
    type = "circle" 
  }) => {
    if (type === "triangle") {
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
          <polygon points="32,12 56,52 8,52" fill="currentColor" opacity="0.6"/>
        </svg>
      );
    }
    
    if (type === "diamond") {
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
          <polygon points="32,12 52,32 32,52 12,32" fill="currentColor" opacity="0.6"/>
        </svg>
      );
    }
    
    // Default circle
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
        <circle cx="32" cy="32" r="24" fill="currentColor" opacity="0.6"/>
      </svg>
    );
  };

  return (
    <motion.div 
      className="relative py-12 md:py-20 bg-transparent"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Modern grid background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto px-4">
        {heroImages.map((image, index) => (
          <motion.div
            key={image.id}
            role="button"
            tabIndex={0}
            onClick={() => handleNavigate("/products")}
            onKeyDown={(e) => handleKeyDown(e, "/products")}
            className="group cursor-pointer w-full transform transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
            variants={cardVariants}
            whileHover={{ y: -5 }}
          >
            {/* Modern glass card with unique shapes */}
            <div className={`
              relative bg-white/70 backdrop-blur-md border border-white/80 shadow-sm overflow-hidden 
              transition-all duration-500 group-hover:shadow-xl group-hover:bg-white/80 group-hover:border-white/90 
              h-[500px] md:h-[600px] w-full
              ${index === 0 
                ? 'rounded-t-[100px] rounded-b-lg' // Left card: circular top, flat bottom
                : 'rounded-t-lg rounded-b-[100px]' // Right card: flat top, circular bottom
              }
            `}>
              
              {/* Image container - completely fills the card */}
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  fill
                  src={image.src}
                  alt={image.title}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-blue-500/0 transition-all duration-500 group-hover:bg-blue-500/3" />

                {/* Decorative Petals and Shapes with Animations */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Petals - different positions for each card */}
                  {index === 0 ? (
                    <>
                      {/* Left card decorations */}
                      <motion.div 
                        className="absolute top-8 left-6 text-white/20"
                        variants={floatVariants}
                        animate="float"
                      >
                        <PetalSVG className="w-10 h-10" rotate={45} />
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-8 right-8 text-white/15"
                        variants={floatVariants}
                        animate="float"
                        transition={{ delay: 1 }}
                      >
                        <PetalSVG className="w-8 h-8" rotate={-20} />
                      </motion.div>
                      <motion.div 
                        className="absolute top-1/2 left-1/3 text-white/25"
                        variants={floatVariants}
                        animate="float"
                        transition={{ delay: 0.5 }}
                      >
                        <PetalSVG className="w-6 h-6" rotate={120} />
                      </motion.div>
                      <motion.div 
                        className="absolute top-3/4 left-8 text-white/20"
                        variants={floatVariants}
                        animate="float"
                        transition={{ delay: 1.5 }}
                      >
                        <PetalSVG className="w-7 h-7" rotate={-60} />
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* Right card decorations */}
                      <motion.div 
                        className="absolute top-8 right-6 text-white/20"
                        variants={floatVariants}
                        animate="float"
                      >
                        <PetalSVG className="w-9 h-9" rotate={-30} />
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-8 left-8 text-white/15"
                        variants={floatVariants}
                        animate="float"
                        transition={{ delay: 1 }}
                      >
                        <PetalSVG className="w-7 h-7" rotate={80} />
                      </motion.div>
                      <motion.div 
                        className="absolute top-1/3 right-1/3 text-white/25"
                        variants={floatVariants}
                        animate="float"
                        transition={{ delay: 0.5 }}
                      >
                        <PetalSVG className="w-8 h-8" rotate={160} />
                      </motion.div>
                      <motion.div 
                        className="absolute top-2/3 left-12 text-white/20"
                        variants={floatVariants}
                        animate="float"
                        transition={{ delay: 1.5 }}
                      >
                        <PetalSVG className="w-5 h-5" rotate={-120} />
                      </motion.div>
                    </>
                  )}

                  {/* Flowers */}
                  <motion.div 
                    className="absolute top-12 right-12 text-white/15"
                    variants={floatVariants}
                    animate="float"
                    transition={{ delay: 0.3 }}
                  >
                    <FlowerSVG className="w-8 h-8" />
                  </motion.div>
                  <motion.div 
                    className="absolute bottom-12 left-12 text-white/10"
                    variants={floatVariants}
                    animate="float"
                    transition={{ delay: 0.8 }}
                  >
                    <FlowerSVG className="w-6 h-6" />
                  </motion.div>

                  {/* Geometric Shapes */}
                  <motion.div 
                    className="absolute top-16 left-16 text-white/20"
                    variants={floatVariants}
                    animate="float"
                    transition={{ delay: 0.6 }}
                  >
                    <GeometricShape type="circle" className="w-4 h-4" />
                  </motion.div>
                  <motion.div 
                    className="absolute bottom-16 right-16 text-white/15"
                    variants={floatVariants}
                    animate="float"
                    transition={{ delay: 1.2 }}
                  >
                    <GeometricShape type="triangle" className="w-5 h-5" />
                  </motion.div>
                  <motion.div 
                    className="absolute top-1/4 right-1/4 text-white/25"
                    variants={floatVariants}
                    animate="float"
                    transition={{ delay: 0.9 }}
                  >
                    <GeometricShape type="diamond" className="w-3 h-3" />
                  </motion.div>
                  <motion.div 
                    className="absolute bottom-1/3 left-1/4 text-white/20"
                    variants={floatVariants}
                    animate="float"
                    transition={{ delay: 1.4 }}
                  >
                    <GeometricShape type="circle" className="w-3 h-3" />
                  </motion.div>
                </div>

                {/* Content section at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                  <div className="text-center mb-4">
                    <h3 className="text-white text-xl md:text-2xl font-bold mb-2">
                      {image.title}
                    </h3>
                    <p className="text-white/80 text-sm md:text-base">
                      {image.subtitle}
                    </p>
                  </div>

                  {/* Floating CTA Button - Now at bottom for both cards */}
                  <motion.div 
                    className="flex justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate("/products");
                      }}
                      className="relative bg-white/10 backdrop-blur-md text-white hover:text-white hover:bg-white/20 border border-white/30 px-6 py-3 rounded-xl transition-all duration-300 group/btn overflow-hidden shadow-lg"
                    >
                      <span className="relative z-10 flex items-center gap-2 font-medium">
                        Explore Now 
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </span>
                      
                      {/* Subtle shimmer effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Conditional corner accents based on card shape */}
              {index === 0 ? (
                // Left card: only top corners rounded
                <>
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-[100px]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-[100px]" />
                </>
              ) : (
                // Right card: only bottom corners rounded
                <>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-[100px]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-[100px]" />
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Global decorative elements with animations */}
      <motion.div 
        className="absolute -left-4 top-1/4 w-8 h-8 bg-white/30 rounded-full blur-sm"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute -right-4 bottom-1/4 w-12 h-12 bg-white/20 rounded-full blur-sm"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      {/* Additional floating decorative elements */}
      <motion.div 
        className="absolute top-1/3 left-8 text-white/10"
        variants={floatVariants}
        animate="float"
        transition={{ delay: 0.5 }}
      >
        <PetalSVG className="w-12 h-12" rotate={15} />
      </motion.div>
      <motion.div 
        className="absolute bottom-1/4 right-12 text-white/8"
        variants={floatVariants}
        animate="float"
        transition={{ delay: 1 }}
      >
        <FlowerSVG className="w-10 h-10" />
      </motion.div>
      <motion.div 
        className="absolute top-1/2 left-10 text-white/15"
        variants={floatVariants}
        animate="float"
        transition={{ delay: 1.5 }}
      >
        <GeometricShape type="triangle" className="w-6 h-6" />
      </motion.div>
    </motion.div>
  );
}