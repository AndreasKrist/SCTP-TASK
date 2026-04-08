import React, { useState } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import Button from '../ui/Button';
import { biodataQuestions } from '../../data/questions';
import { useRouter } from 'next/router';

export default function BiodataForm() {
  const { biodata, updateBiodata, nextStage, resetAssessment } = useAssessment();
  const [errors, setErrors] = useState({});
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

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-blue-100">
      <div className="p-6">
        {/* Start Over Button */}
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            onClick={handleStartOver}
            className="px-6 py-2 text-sm"
          >
            🔄 Start Over
          </Button>
        </div>

        <h2 className="text-xl font-bold mb-3 text-center text-blue-800">
          Tell Us About Yourself
        </h2>
        
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {biodataQuestions.map((question, index) => (
            <div
              key={question.id}
              className="space-y-1"
            >
              <label 
                htmlFor={question.id} 
                className="block text-sm font-medium text-blue-800"
              >
                {question.label}{question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {question.type === 'select' ? (
                <select
                  id={question.id}
                  name={question.id}
                  value={biodata[question.id] || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-xl shadow-sm bg-white transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 ${
                    errors[question.id]
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an option</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={question.type}
                  id={question.id}
                  name={question.id}
                  value={biodata[question.id] || ''}
                  placeholder={question.placeholder || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-xl shadow-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 ${
                    errors[question.id]
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                />
              )}

              <AnimatedError error={errors[question.id]} />
            </div>
          ))}

          <div className="flex justify-center pt-2">
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
          </div>
        </form>
      </div>
    </div>
  );
}

// Error message component
function AnimatedError({ error }) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-600 mt-2">
      {error}
    </p>
  );
}