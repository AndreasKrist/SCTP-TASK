import React, { useState } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import Button from '../ui/Button';
import { biodataQuestions } from '../../data/questions';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function BiodataForm() {
  const { biodata, updateBiodata, nextStage, resetAssessment } = useAssessment();
  const [errors, setErrors] = useState({});
  const [activeField, setActiveField] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateBiodata({ [name]: value });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    biodataQuestions.forEach(question => {
      if (question.required && !biodata[question.id]) {
        newErrors[question.id] = `${question.label} is required`;
        isValid = false;
      }
    });

    // Validate email format if provided
    if (biodata.email && !/\S+@\S+\.\S+/.test(biodata.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      nextStage();
    } else {
      // Scroll to first error
      const firstErrorId = Object.keys(errors)[0];
      if (firstErrorId) {
        document.getElementById(firstErrorId)?.focus();
      }
    }
  };

  const handleStartOver = () => {
    resetAssessment();
    router.push('/');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.1,
        when: "beforeChildren",
        staggerChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.1 }
    }
  };

  const formFieldAnimation = {
    focused: {
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)",
      borderColor: "#3b82f6",
      scale: 1.01
    },
    error: {
      boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.3)",
      borderColor: "#ef4444",
    },
    normal: {
      boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)",
      borderColor: "#e5e7eb",
      scale: 1
    }
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-6">
        {/* Start Over Button */}
        <motion.div
          className="flex justify-center mb-4"
          variants={itemVariants}
        >
          <Button 
            variant="outline" 
            onClick={handleStartOver}
            className="px-6 py-2 text-sm"
          >
            🔄 Start Over
          </Button>
        </motion.div>

        <motion.h2
          className="text-xl font-bold mb-3 text-center text-blue-800"
          variants={itemVariants}
        >
          Tell Us About Yourself
        </motion.h2>
        
        {/* Clear Instructions */}
        {/* Biodata instruction - HIDDEN - Uncomment to show */}
        {/* <motion.div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8"
          variants={itemVariants}
        >
          <p className="text-blue-700 text-center text-sm">
            📝 Please fill in your information below, then click the <strong>&ldquo;Continue&rdquo;</strong> button at the bottom to move to the next step.
          </p>
        </motion.div> */}
        
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          variants={containerVariants}
        >
          {biodataQuestions.map((question, index) => (
            <motion.div 
              key={question.id} 
              className="space-y-1"
              variants={itemVariants}
              custom={index}
            >
              <label 
                htmlFor={question.id} 
                className="block text-sm font-medium text-blue-800"
              >
                {question.label}{question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {question.type === 'select' ? (
                <motion.select
                  id={question.id}
                  name={question.id}
                  value={biodata[question.id] || ''}
                  onChange={handleChange}
                  onFocus={() => setActiveField(question.id)}
                  onBlur={() => setActiveField(null)}
                  animate={
                    activeField === question.id
                      ? "focused"
                      : errors[question.id]
                      ? "error"
                      : "normal"
                  }
                  variants={formFieldAnimation}
                  transition={{ duration: 0.2 }}
                  className={`w-full px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none bg-white ${
                    errors[question.id] 
                      ? 'border-red-500' 
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an option</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </motion.select>
              ) : (
                <motion.input
                  type={question.type}
                  id={question.id}
                  name={question.id}
                  value={biodata[question.id] || ''}
                  placeholder={question.placeholder || ''}
                  onChange={handleChange}
                  onFocus={() => setActiveField(question.id)}
                  onBlur={() => setActiveField(null)}
                  animate={
                    activeField === question.id
                      ? "focused"
                      : errors[question.id]
                      ? "error"
                      : "normal"
                  }
                  variants={formFieldAnimation}
                  transition={{ duration: 0.2 }}
                  className={`w-full px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none ${
                    errors[question.id] 
                      ? 'border-red-500' 
                      : 'border-gray-300'
                  }`}
                />
              )}
              
              <AnimatedError error={errors[question.id]} />
            </motion.div>
          ))}
          
          <motion.div
            className="flex justify-center pt-2"
            variants={itemVariants}
          >
            <div className="text-center">
              <Button 
                type="submit"
                className="px-8 py-3 mb-2"
              >
                Continue
              </Button>
              <p className="text-xs text-blue-600">
                👆 Click &ldquo;Continue&rdquo; to go to the next step
              </p>
            </div>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  );
}

// Animated error message component
function AnimatedError({ error }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ 
        opacity: error ? 1 : 0, 
        height: error ? 'auto' : 0,
        marginTop: error ? '0.5rem' : 0
      }}
      transition={{ duration: 0.2 }}
    >
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </motion.div>
  );
}