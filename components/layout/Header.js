import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-sm transition-all duration-300 ${
      scrolled 
        ? 'bg-white/55 shadow-md py-3 sm:py-3' 
        : 'bg-transparent py-4 sm:py-4'
    }`}>
      <div className="container mx-auto px-4 flex justify-center items-center">
        <Link href="/">
          <motion.div 
            className="flex items-center cursor-pointer" 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div 
              className="mr-2 sm:mr-3 flex items-center justify-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Image 
                src="/images/itel-logo.png" 
                alt="ITEL Logo" 
                width={32} 
                height={32}
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
            </motion.div>
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              ITEL - TIRA
            </span>
          </motion.div>
        </Link>
      </div>
    </header>
  );
}