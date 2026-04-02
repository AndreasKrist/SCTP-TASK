import React from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
// import Footer from './Footer'; // HIDDEN - Uncomment to show footer in the future
import AvatarGuide from './AvatarGuide';

// Animation variants for page transitions
const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.08 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.05 }
  }
};

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          {children}
        </motion.div>
      </main>
      
      {/* FOOTER HIDDEN - Uncomment the line below to show footer in the future */}
      {/* <Footer /> */}
      {/* CHATBOT HIDDEN - Uncomment the line below to show chatbot in the future */}
      {/* <AvatarGuide /> */}
    </div>
  );
}