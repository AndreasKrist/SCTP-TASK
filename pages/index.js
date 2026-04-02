import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAssessment } from '../contexts/AssessmentContext';
import Layout from '../components/layout/Layout';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 10 }
  }
};

const PrimaryButton = ({ children, onClick, className = '', disabled = false }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`btn btn-primary ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'pulse'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

export default function Home() {
  const router = useRouter();
  const { startAssessment } = useAssessment();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const handleStartAssessment = () => {
    // This ensures a clean start every time
    startAssessment();
    router.push('/assessment');
  };

  // Create ripple effect on button click
  useEffect(() => {
    function createRipple(e) {
      const button = e.currentTarget;
      
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - button.offsetLeft - diameter / 2}px`;
      circle.style.top = `${e.clientY - button.offsetTop - diameter / 2}px`;
      circle.classList.add('ripple');
      
      const ripple = button.getElementsByClassName('ripple')[0];
      if (ripple) {
        ripple.remove();
      }
      
      button.appendChild(circle);
    }
    
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('click', createRipple);
    });
    
    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', createRipple);
      });
    };
  }, []);

  return (
    <Layout>
      <Head>
        <title>Tech Industry Readiness Assessor - TIRA</title>
        <meta name="description" content="Discover your potential IT career path and get personalized course recommendations." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/images/itel-logo.png" />
      </Head>

      <div className="container mx-auto px-4 py-4">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1 }}
        >
          <div className="text-center mb-8 sm:mb-12">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-blue-900 relative px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
            >
              <span className="relative inline-block">
                <span className="block sm:inline">TIRA: Tech Industry </span>
                <span className="block sm:inline">Readiness Assessor</span>
                <motion.span 
                  className="absolute -bottom-2 left-0 w-full h-1 bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.1 }}
                ></motion.span>
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl text-blue-700 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              {/* Unlock Your IT Potential with Personalized Course Recommendations. */}
              Explore Your IT Know-How with TIRA
            </motion.p>
          </div>
          
          <motion.div
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1 }}
          >
            <div className="p-6 sm:p-8">
              {/* Welcome Section */}
              <motion.div 
                className="text-center mb-6 sm:mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
              >
                <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-blue-900">
                  Welcome to ITEL&apos;s TIRA: Tech Industry Readiness Assessor! 👋
                </h2>
                <p className="text-base sm:text-lg text-blue-700 mb-4">
                  {/* This assessment helps you discover your potential in Tech and provides personalized course recommendations to boost your career. */}
                  This assessment is your first step towards discovering a possible career in Tech
                  {/* We'll assess your skills and recommend personalized courses to help you achieve your goals. */}
                </p>
                <p className="text-sm sm:text-base text-blue-600">
                  {/* Whether you&apos;re just starting out or looking to advance your skills, we&apos;ll guide you toward the right learning path based on your current knowledge and discipline. */}
                  {/* We'll assess your skills and recommend personalized courses to help you achieve your goals. */}
                </p>
              </motion.div>

              {/* Collapsible How It Works Section */}
              <motion.div 
                className="mb-6 sm:mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                <div className="text-center mb-4">
                  <button
                    onClick={() => setShowHowItWorks(!showHowItWorks)}
                    className="inline-flex items-center px-4 sm:px-6 py-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all duration-200 font-medium text-sm sm:text-base"
                  >
                    <span className="mr-2">How It Works</span>
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      animate={{ rotate: showHowItWorks ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    height: showHowItWorks ? 'auto' : 0,
                    opacity: showHowItWorks ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="bg-blue-gradient rounded-xl p-4 sm:p-8">
                    <motion.div 
                      className="space-y-6 md:space-y-0"
                      variants={containerVariants}
                      initial="hidden"
                      animate={showHowItWorks ? "visible" : "hidden"}
                    >
                      {/* Responsive Grid: 1-column on mobile, 2x2 on desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row">
                          <div className="flex-shrink-0 h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-lg mr-0 sm:mr-4 mb-3 sm:mb-0 mx-auto sm:mx-0">
                            1
                          </div>
                          <div className="text-center sm:text-left sm:mt-1">
                            <h3 className="font-semibold text-lg text-blue-800">Tell Us About Yourself</h3>
                            <p className="text-blue-700 text-sm mt-1">
                              Enter your basic information to get started
                            </p>
                          </div>
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row">
                          <div className="flex-shrink-0 h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-lg mr-0 sm:mr-4 mb-3 sm:mb-0 mx-auto sm:mx-0">
                            2
                          </div>
                          <div className="text-center sm:text-left sm:mt-1">
                            <h3 className="font-semibold text-lg text-blue-800">Choose Your Area of Discipline</h3>
                            <p className="text-blue-700 text-sm mt-1">
                              Select between Network or Cybersecurity
                            </p>
                          </div>
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row">
                          <div className="flex-shrink-0 h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-lg mr-0 sm:mr-4 mb-3 sm:mb-0 mx-auto sm:mx-0">
                            3
                          </div>
                          <div className="text-center sm:text-left sm:mt-1">
                            <h3 className="font-semibold text-lg text-blue-800">Answer Simple Questions</h3>
                            <p className="text-blue-700 text-sm mt-1">
                              Answer yes/no questions about your current knowledge
                            </p>
                          </div>
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row">
                          <div className="flex-shrink-0 h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-lg mr-0 sm:mr-4 mb-3 sm:mb-0 mx-auto sm:mx-0">
                            4
                          </div>
                          <div className="text-center sm:text-left sm:mt-1">
                            <h3 className="font-semibold text-lg text-blue-800">Get Your Summary</h3>
                            <p className="text-blue-700 text-sm mt-1">
                              Receive your summary of skills analysis
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
              >
                <PrimaryButton 
                  onClick={handleStartAssessment}
                  className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl"
                >
                  Start Assessment
                </PrimaryButton>
                
                <motion.p 
                  className="mt-4 text-sm sm:text-base text-blue-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                >
                  This assessment will take only between 3 to 5 minutes to complete
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}