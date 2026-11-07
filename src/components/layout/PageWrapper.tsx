import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function PageWrapper({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`min-h-screen pt-24 pb-28 md:pb-12 ${className}`}
    >
      {children}
    </motion.div>
  );
}
