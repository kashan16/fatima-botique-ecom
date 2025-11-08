// components/common/AnimatedLayoutWrapper.tsx
'use client';

import { easeOut, motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedLayoutWrapperProps {
  children: ReactNode;
  type?: 'navbar' | 'main' | 'footer';
}

export function AnimatedLayoutWrapper({ children, type = 'main' }: AnimatedLayoutWrapperProps) {
  const getAnimationProps = () => {
    switch (type) {
      case 'navbar':
        return {
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: easeOut }
        };
      case 'main':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.8, delay: 0.2 }
        };
      case 'footer':
        return {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true, margin: "-50px" },
          transition: { duration: 0.8 }
        };
      default:
        return {};
    }
  };

  return (
    <motion.div {...getAnimationProps()}>
      {children}
    </motion.div>
  );
}