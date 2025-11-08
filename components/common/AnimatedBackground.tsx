// components/common/AnimatedBackground.tsx
'use client';

import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Main gradient background - adjusted for better visibility */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/90 to-indigo-50/80" />
            
            {/* Animated gradient orbs - increased visibility */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/40 to-purple-200/30 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    x: [0, -80, 0],
                    y: [0, 60, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
                className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-indigo-200/30 to-pink-200/20 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    x: [0, 60, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                }}
                className="absolute top-2/3 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-200/25 to-blue-200/25 rounded-full blur-3xl"
            />
            
            {/* Subtle grid pattern */}
            <div 
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }}
            />
            
            {/* Animated floating particles */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, -20, 0],
                        x: [0, Math.random() * 15 - 7.5, 0],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 4,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                    className="absolute w-1 h-1 bg-blue-300/40 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                />
            ))}
        </div>
    );
};