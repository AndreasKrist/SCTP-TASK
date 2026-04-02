import React from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import Button from '../ui/Button';
import { useRouter } from 'next/router';

export default function RoleSelection() {
  const { selectRole, nextStage, selectedRole, resetAssessment, prevStage } = useAssessment();
  const router = useRouter();
  
  const roles = [
    {
      id: 'networkAdmin',
      title: 'SCTP Network Administration',
      certifications: 'ITIL 4 + CompTIA A+ + Network+ + Ops Problem Solving',
      description: 'Manage and maintain computer networks, ensuring they function efficiently and securely.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500 mb-3 sm:mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
          <path d="M6 10v4"></path>
          <path d="M12 10v4"></path>
          <path d="M18 10v4"></path>
        </svg>
      ),
      skills: ['Network configuration', 'Troubleshooting', 'Hardware management', 'User support']
    },
    {
      id: 'cybersecurity',
      title: 'SCTP CYBER SECURITY',
      certifications: 'ITIL 4 + CCNA Security + CND + CEH + Supervisory Decision Making',
      description: 'Protect systems, networks, and data from digital attacks and unauthorized access.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500 mb-3 sm:mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      skills: ['Threat detection', 'Security protocols', 'Risk assessment', 'Incident response']
    }
  ];

  const handleSelectRole = (roleId) => {
    selectRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      nextStage();
    }
  };

  const handleStartOver = () => {
    resetAssessment();
    router.push('/');
  };

  return (
    <div className="max-w-4xl w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-blue-200">
      <div className="p-4 sm:p-6 lg:p-10">
        
        {/* Start Over Button */}
        <div className="flex justify-center mb-6">
          <Button 
            variant="outline" 
            onClick={handleStartOver}
            className="px-6 py-2 text-sm"
          >
            🔄 Start Over
          </Button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-center text-blue-800">Choose Your Area of Discipline</h2>
        <p className="text-blue-700 text-center mb-6 sm:mb-8 text-base sm:text-lg">
          Click one of the disciplines below to select it!
        </p>

        {/* Clear Instructions - HIDDEN - Uncomment to show */}
        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-700 text-center text-sm">
            📋 First, click on one of the disciplines below to select it (it will be highlighted). Then click the <strong>&quot;Continue&quot;</strong> button at the bottom to move to the questions.
          </p>
        </div> */}
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-2 mb-8">
          {roles.map((role) => (
            <div 
              key={role.id}
              className={`border rounded-xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-md ${
                selectedRole === role.id 
                  ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50' 
                  : 'border-blue-200 hover:border-blue-300'
              }`}
              onClick={() => handleSelectRole(role.id)}
            >
              <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
                {role.icon}
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-800 whitespace-nowrap">{role.title}</h3>
                <p className="text-xs sm:text-sm text-blue-500 mt-1">{role.certifications}</p>
              </div>
              
              {/* Description - HIDDEN - Uncomment to show */}
              {/* <p className="text-blue-700 mb-4 sm:mb-6 text-center text-sm sm:text-base lg:text-lg">
                {role.description}
              </p> */}
              
              {/* Key skills - HIDDEN - Uncomment to show */}
              {/* <div className="mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm font-medium text-blue-700 mb-2 sm:mb-3">Key skills:</p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {role.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-block px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-600 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div> */}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button 
            variant="secondary" 
            onClick={prevStage}
            className="w-full sm:w-auto px-8 py-3"
          >
            Back
          </Button>
          
          <div className="text-center">
            <Button 
              onClick={handleContinue}
              disabled={!selectedRole}
              className={`w-full sm:w-auto px-8 py-4 text-lg mb-2 ${selectedRole ? 'shadow-lg shadow-blue-500/20' : ''}`}
            >
              Continue
            </Button>
            <p className="text-xs text-blue-600">
              {selectedRole 
                ? "👆 Click 'Continue' to start the questions" 
                : "👆 First select a discipline above, then click 'Continue'"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}