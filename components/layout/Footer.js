import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAssessment } from '../../contexts/AssessmentContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const { startAssessment } = useAssessment();
  
  // Handle assessment link click
  const handleAssessmentClick = (e) => {
    if (router.pathname !== '/assessment') {
      e.preventDefault();
      startAssessment();
      router.push('/assessment');
    }
  };
  
  return (
    <footer className="py-6 relative mt-20 bg-blue-900">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Logo on top, then Explore and ITEL side by side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Logo and Description */}
            <div className="md:col-span-1">
              <motion.div 
                className="flex items-center mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mr-3 flex items-center justify-center">
                  <Image 
                    src="/images/itel-logo.png" 
                    alt="ITEL Logo" 
                    width={32} 
                    height={32}
                    className="h-8 w-auto"
                  />
                </div>
                <span className="text-lg font-bold text-white">
                  Tech Industry Readiness Assessor
                </span>
              </motion.div>
              <p className="text-blue-100 text-sm">
                Find your ideal IT career path and get personalized learning recommendations.
              </p>
            </div>
            
            {/* Explore and ITEL - Always side by side */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-6">
                
                {/* Explore Section */}
                <div>
                  <h4 className="text-white font-semibold mb-4">Explore</h4>
                  <ul className="space-y-2">
                    <motion.li 
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link href="/" className="text-blue-100 hover:text-white text-sm transition-colors duration-200">Home</Link>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={handleAssessmentClick}
                        className="text-blue-100 hover:text-white text-sm transition-colors duration-200 text-left"
                      >
                        Start Assessment
                      </button>
                    </motion.li>
                  </ul>
                </div>
                
                {/* ITEL Section - Always beside Explore */}
                <div>
                  <h4 className="text-white font-semibold mb-4">ITEL</h4>
                  <ul className="space-y-2">
                    <motion.li 
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <a 
                        href="https://itel.com.sg/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-100 hover:text-white text-sm transition-colors duration-200"
                      >
                        Website
                      </a>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <a 
                        href="https://itel.com.sg/contact-us/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-100 hover:text-white text-sm transition-colors duration-200"
                      >
                        Contact Us
                      </a>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <a 
                        href="https://itel.com.sg/resources/events/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-100 hover:text-white text-sm transition-colors duration-200"
                      >
                        Events
                      </a>
                    </motion.li>
                  </ul>
                </div>
                
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-600 mt-6 pt-4 text-center">
            <p className="text-blue-100 text-sm">
              © {currentYear} ITEL - TIRA. All rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}