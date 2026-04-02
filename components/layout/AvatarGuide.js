import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssessment } from '../../contexts/AssessmentContext';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function AvatarGuide() {
  const [currentMessage, setCurrentMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [avatarExpression, setAvatarExpression] = useState('happy');
  const { stage, selectedRole, currentBatch, biodata, results } = useAssessment();
  const router = useRouter();
  const inactivityTimerRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());
  const [userClosedMessage, setUserClosedMessage] = useState(false);
  const lastStageRef = useRef(stage);
  const autoHideTimerRef = useRef(null);
  
  // Helper function to create button-like styling in messages
  const createButtonText = useCallback((text) => {
    return `<span style="display: inline-block; background: #2563eb; color: white; padding: 4px 12px; border-radius: 8px; font-weight: 500; font-size: 14px;">${text}</span>`;
  }, []);
  
  // Get help message when user is inactive
  const getHelpMessage = useCallback(() => {
    const firstName = biodata.fullName ? biodata.fullName.split(' ')[0] : 'there';
    
    if (router.pathname === '/') {
      return `Hi ${firstName}! 👋 I noticed you're still here. To get started, please click the ${createButtonText('Start Assessment')} button below. This will begin your personalized IT skills assessment!`;
    }
    
    if (router.pathname === '/results') {
      return `${firstName}, congratulations on completing your assessment! 🎉 Your results have been saved!. You can click ${createButtonText('Start Over')} if you want to take the assessment again or explore different career paths.`;
    }
    
    switch (stage) {
      case 'welcome':
        return `${firstName}, let's get started! 🌟 Click the ${createButtonText('Start Assessment')} button to begin your journey into IT career discovery!`;
      
      case 'biodata':
        return `${firstName}! 📝 I see you're on the information page. Please fill in all the required fields (marked with red *), then click the ${createButtonText('Continue')} button at the bottom to move to the next step. Don't worry, your information is safe with us!`;
      
      case 'roleSelection':
        return `${firstName}! 🎯 I see you need to choose your discipline. Click on either "Network" or "Cybersecurity" - the box will turn blue when selected. Then click the ${createButtonText('Continue')} button at the bottom to proceed with your chosen path!`;
      
      case 'generalQuestions':
        if (currentBatch === 0) {
          return `${firstName}! 💻 I notice you're looking at the general IT questions. For each question, click either ${createButtonText('Yes')} or ${createButtonText('No')} button to answer. After answering ALL questions on this page, click the  ${createButtonText('Continue')} button at the bottom to move forward!`;
        } else {
          return `${firstName}! 🌟 You're doing great! These are the final general questions. Remember to click ${createButtonText('Yes')} or ${createButtonText('No')} for each question, then click ${createButtonText('Continue')} at the bottom when you've answered everything!`;
        }
      
      case 'roleQuestions':
        const roleName = selectedRole === 'networkAdmin' ? 'Network' : 'Cybersecurity';
        if (currentBatch === 0) {
          return `${firstName}! 🎯 Now you're on the ${roleName} questions - excellent choice! Click ${createButtonText('Yes')} or ${createButtonText('No')} for each question based on your knowledge. Don't worry if you don't know something - that's normal! Click ${createButtonText('Continue')} when all questions are answered.`;
        } else {
          return `${firstName}! 🏁 These are your final ${roleName} questions - you're almost done! Answer each question with ${createButtonText('Yes')} or ${createButtonText('No')}, then click ${createButtonText('Continue')} to automatically save your results and see your personalized summary!`;
        }
      
      default:
        return `${firstName}! 😊 I'm here to help guide you through the assessment. If you need assistance, just click on me anytime! Remember to click buttons as instructed to move through each step.`;
    }
  }, [biodata.fullName, router.pathname, stage, currentBatch, selectedRole, createButtonText]);
  
  // Clear any existing auto-hide timer
  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);
  
  // Reset inactivity timer whenever user interacts
  const resetInactivityTimer = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new timer for auto-popup after 8 seconds of inactivity (only if user didn't manually close)
    inactivityTimerRef.current = setTimeout(() => {
      if (!showMessage && !userClosedMessage) {
        const helpMessage = getHelpMessage();
        setCurrentMessage(helpMessage);
        setAvatarExpression('helpful');
        setShowMessage(true);
        // NO AUTO-HIDE TIMER - message stays until manually closed
      }
    }, router.pathname === '/' ? 7000 : 8000);
  }, [showMessage, getHelpMessage, router.pathname, userClosedMessage]);

  // Track user interactions
  useEffect(() => {
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Listen for various user interactions
    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Start the timer initially
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [showMessage, resetInactivityTimer]);
  
  // Get contextual messages based on current stage and page
  const getContextualMessage = useCallback(() => {
    const firstName = biodata.fullName ? biodata.fullName.split(' ')[0] : 'there';
    
    if (router.pathname === '/') {
      setAvatarExpression('welcoming');
      return `Hello ${firstName}! 👋 Welcome to ITEL's TIRA: Tech Industry Readiness Assessor! I'm your virtual assistant and I'll help you every step of the way. 

🎯 <b>What to do now: </b>
Click the ${createButtonText('Start Assessment')} button below to begin discovering your IT potential! 

I'll be here throughout your journey to provide helpful tips and guidance. Let's get started! 🚀`;
    }
    
    if (router.pathname === '/results') {
      const successRate = results.successRate || 0;
      if (successRate >= 80) {
        setAvatarExpression('excited');
        return `Wow, ${firstName}! 🌟 Outstanding work! You scored ${successRate}%! 

🎉 <b>What this means:</b> You have excellent potential in your chosen field!

✅ <b>Great news:</b> Your results have been saved!

📋 <b>What to do now:</b> 
1. Review your personalized recommendations below
2. Contact ITEL about the recommended courses
3. You can click ${createButtonText('Start Over')} to explore other career paths

You're on a great path to IT success! 🚀`;
      } else if (successRate >= 60) {
        setAvatarExpression('encouraging');
        return `Great job, ${firstName}! 👏 You scored ${successRate}% - that shows real potential!

💪 <b>What this means:</b> You have a solid foundation to build upon!

✅ <b>Great news:</b> Your results have been saved!

📋 <b>What to do now:</b>
1. Check your course recommendations below - they're designed just for you!
2. Don't worry about areas you're unfamiliar with - that's why we have courses!
3. Click ${createButtonText('Start Over')} if you want to explore other paths

Every expert was once a beginner! 🌟`;
      } else {
        setAvatarExpression('supportive');
        return `Don't worry, ${firstName}! 💪 Everyone starts somewhere, and your ${successRate}% shows you're ready to learn!

🌱 <b>What this means:</b> You have great potential - you just need the right training!

✅ <b>Great news:</b> Your results have been saved!

📋 <b>What to do now:</b>
1. Look at your personalized course recommendations below
2. Remember: Every IT expert started exactly where you are now!
3. Click ${createButtonText('Start Over')} to try a different career path

The courses I've recommended will build your confidence and skills step by step! 🚀`;
      }
    }
    
    switch (stage) {
      case 'welcome':
        setAvatarExpression('happy');
        return `Hi ${firstName}! 🌟 I'm so excited to help you discover your IT potential!

🎯 <b>What we'll do together:</b>
1. First, I'll ask for some basic information about you
2. Then you'll choose between Network or Cybersecurity  
3. We'll go through some simple Yes/No questions
4. Finally, you'll get personalized course recommendations - all automatically saved!

Ready to start this journey? I'll be with you every step of the way! 🚀`;
      
      case 'biodata':
        setAvatarExpression('curious');
        return `Perfect, ${firstName}! 📝 Now I need to get to know you a little better.

📋 <b>What to do here:</b>
1. Fill in your Full Name (required)
2. Enter your Email Address (required) 
3. Add your Phone Number (optional)
4. Select your Age Group (required)
5. Click the ${createButtonText('Continue')} button at the bottom

⚡ <b>Tip:</b> Look for the red * - those fields are required! Don't worry, your information is completely safe and secure with us. 🔒`;
      
      case 'roleSelection':
        setAvatarExpression('excited');
        return `This is exciting, ${firstName}! 🚀 Time to choose your IT adventure!

🎯 <b>What to do here:</b>
1. Read about both options: Network and Cybersecurity
2. Click on the box of your preferred choice (it will turn blue)
3. Click the ${createButtonText('Continue')} button at the bottom

💡 <b>Don't worry about choosing "wrong"</b> - both are fantastic careers! Pick the one that sounds more interesting to you. You can always change your mind later! 

Which one calls to you? 🤔`;
      
      case 'generalQuestions':
        if (currentBatch === 0) {
          setAvatarExpression('encouraging');
          return `Great job getting here, ${firstName}! 💻 Now for some basic IT questions.

📋 <b>How to answer these questions:</b>
1. Read each question carefully
2. Click ${createButtonText('Yes')} if you can do it, ${createButtonText('No')} if you can't
3. Be honest - there are no wrong answers!
4. If you click ${createButtonText('No')}, you can click "Learn more" to see how we can help
5. After answering ALL questions, click ${createButtonText('Continue')} at the bottom

⚡ <b>Important:</b> Answer every single question before clicking Continue. Take your time! 🕐`;
        } else {
          setAvatarExpression('proud');
          return `You're doing amazing, ${firstName}! 🌟 These are the final general questions.

📋 <b>What to do:</b>
1. Continue answering ${createButtonText('Yes')} or ${createButtonText('No')} to each question
2. Remember, honesty helps us give you better recommendations
3. Answer every question on this page
4. Click ${createButtonText('Continue')} when you're completely done

🎉 <b>You're halfway through!</b> After this, we'll move to your specialized questions. Keep going! 💪`;
        }
      
      case 'roleQuestions':
        const roleName = selectedRole === 'networkAdmin' ? 'Network' : 'Cybersecurity';
        if (currentBatch === 0) {
          setAvatarExpression('focused');
          return `Excellent choice, ${firstName}! 🎯 Now for ${roleName} specific questions.

📋 <b>What to do here:</b>
1. These questions are about your chosen field: ${roleName}
2. Click ${createButtonText('Yes')} if you know/can do it, ${createButtonText('No')} if you don't
3. Don't worry if you answer ${createButtonText('No')} to many - that's totally normal!
4. Answer ALL questions, then click ${createButtonText('Continue')}

💡 <b>Remember:</b> We're not testing you - we're learning how to help you succeed! Be honest so we can recommend the perfect courses. 🎓`;
        } else {
          setAvatarExpression('cheerful');
          return `Almost there, ${firstName}! 🏁 These are your final ${roleName} questions!

📋 <b>Final steps:</b>
1. Answer these last questions with ${createButtonText('Yes')} or ${createButtonText('No')}
2. Be honest about your current knowledge
3. Answer every single question
4. Click ${createButtonText('Continue')} to automatically save and see your results!

🎉 <b>You're about to see:</b> Your success rate, your strengths, areas to improve, and custom course recommendations just for you! Your results will be automatically saved to our database! Exciting! 🌟`;
        }
      
      case 'results':
        setAvatarExpression('celebrating');
        return `Congratulations, ${firstName}! 🎉 You've completed your assessment!

🏆 <b>What you've accomplished:</b>
✅ Completed your personal IT skills assessment
✅ Discovered your strengths and growth areas  
✅ Received personalized course recommendations
✅ Your results have been saved!
✅ Taken the first step toward your IT career!

🎯 <b>Next steps:</b> Review your results and consider the recommended courses. I'm so proud of you for taking this important step toward your future! 🌟`;
      
      default:
        setAvatarExpression('happy');
        return `Hey ${firstName}! 😊 I'm your friendly assessment guide, and I'm here to help you succeed!

💡 <b>Need help?</b> Just click on me anytime for guidance on what to do next. I'll give you step-by-step instructions to make this assessment easy and stress-free!

🚀 <b>Remember:</b> There are no wrong answers - we're here to discover how to help you succeed in IT!`;
    }
  }, [biodata.fullName, router.pathname, stage, currentBatch, selectedRole, results.successRate, createButtonText]);
  
  // Different avatar expressions
  const getAvatarExpression = () => {
    switch (avatarExpression) {
      case 'happy':
        return (
          <>
            <circle cx="45" cy="32" r="1.5" fill="white" />
            <circle cx="55" cy="32" r="1.5" fill="white" />
            <path d="M 42 38 Q 50 44 58 38" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'excited':
        return (
          <>
            <ellipse cx="45" cy="32" rx="2" ry="1.5" fill="white" />
            <ellipse cx="55" cy="32" rx="2" ry="1.5" fill="white" />
            <ellipse cx="50" cy="40" rx="4" ry="3" fill="white" />
          </>
        );
      case 'encouraging':
      case 'helpful':
        return (
          <>
            <circle cx="45" cy="32" r="1.5" fill="white" />
            <circle cx="55" cy="32" r="1.5" fill="white" />
            <path d="M 44 38 Q 50 42 56 38" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'welcoming':
        return (
          <>
            <path d="M 43 30 Q 45 28 47 30" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 53 30 Q 55 28 57 30" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="40" r="3" fill="white" />
          </>
        );
      default:
        return (
          <>
            <circle cx="45" cy="32" r="1.5" fill="white" />
            <circle cx="55" cy="32" r="1.5" fill="white" />
            <path d="M 42 38 Q 50 44 58 38" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
    }
  };
  
  // Update message when stage changes, but don't show immediately
  useEffect(() => {
    const newMessage = getContextualMessage();
    setCurrentMessage(newMessage);
    
    // Check if this is an actual stage change
    const stageChanged = stage !== lastStageRef.current;
    lastStageRef.current = stage;
    
    // When stage changes, just update the message content but DON'T show immediately
    if (stageChanged) {
      // Clear any auto-hide timer
      clearAutoHideTimer();
      
      // Reset the manual close flag on stage change so inactivity timer can work
      setUserClosedMessage(false);
      
      // DON'T show immediately - let the inactivity timer handle it
    }
    
    // Reset inactivity timer when stage changes (this will start the 7-8 second delay)
    resetInactivityTimer();
  }, [stage, router.pathname, currentBatch, selectedRole, biodata.fullName, results.successRate, resetInactivityTimer, getContextualMessage, clearAutoHideTimer]);
  
  // Toggle message visibility when avatar is clicked
  const handleAvatarClick = () => {
    // Clear any auto-hide timer
    clearAutoHideTimer();
    
    if (showMessage) {
      setShowMessage(false);
      setUserClosedMessage(true); // Track that user manually closed
    } else {
      const newMessage = getContextualMessage();
      setCurrentMessage(newMessage);
      setShowMessage(true);
      setUserClosedMessage(false); // Reset when user manually opens
      
      // NO AUTO-HIDE TIMER - message stays until manually closed
    }
    
    // Reset activity timer when user clicks avatar
    resetInactivityTimer();
  };
  
  // Reset manual close flag when route changes
  useEffect(() => {
    setUserClosedMessage(false);
    // Also clear any auto-hide timers when route changes
    clearAutoHideTimer();
  }, [router.pathname, clearAutoHideTimer]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      clearAutoHideTimer();
    };
  }, [clearAutoHideTimer]);
  
  // Don't show on admin page
  if (router.pathname === '/admin') {
    return null;
  }
  
  return (
    <div className="fixed bottom-6 right-20 z-50">
      {/* Message Bubble - Much Wider and Better Positioned */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-28 right-0 mb-4 w-80 sm:w-96 max-h-96 overflow-y-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6 relative">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-base font-semibold text-blue-800">Virtual Assistant 🤖</h4>
                <button
                  onClick={() => {
                    clearAutoHideTimer(); // Clear any auto-hide timer
                    setShowMessage(false);
                    setUserClosedMessage(true); // Track manual close
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close help message"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-blue-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: currentMessage.replace(/\n/g, '<br>') }} />
              {/* Speech bubble tail */}
              <div className="absolute bottom-0 right-12 transform translate-y-full">
                <div className="w-0 h-0 border-l-10 border-r-10 border-t-10 border-l-transparent border-r-transparent border-t-white"></div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-200"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bigger Avatar - No minimize button */}
      <motion.div
        className="relative cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAvatarClick}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-400"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Bigger Avatar Container */}
        <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-xl border-4 border-white overflow-hidden">
          {/* Avatar Image - Using Next.js Image component instead of img */}
          <div className="relative w-full h-full">
            <Image
              src="/images/avatar2.avif"
              alt="Your Guide"
              fill
              sizes="(max-width: 768px) 96px, 96px"
              className="object-cover"
              onError={(e) => {
                // Fallback to SVG if image doesn't load
                const target = e.target;
                if (target && target.nextSibling) {
                  target.style.display = 'none';
                  target.nextSibling.style.display = 'block';
                }
              }}
            />
          </div>
          
          {/* Fallback SVG (hidden by default) */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-white absolute inset-0"
            fill="currentColor"
            style={{ display: 'none' }}
          >
            {/* Head */}
            <circle cx="50" cy="35" r="12" />
            {/* Body */}
            <ellipse cx="50" cy="65" rx="18" ry="15" />
            {/* Dynamic expression */}
            {getAvatarExpression()}
          </svg>
          
          {/* Animated status indicator */}
          <motion.div
            className="absolute top-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>
      
      {/* Floating hint when not showing message */}
      {!showMessage && (
        <motion.div
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-sm px-4 py-2 rounded-full whitespace-nowrap shadow-lg"
          animate={{
            y: [-2, 2, -2],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          💬 Click here for Virtual Assistant!
        </motion.div>
      )}
    </div>
  );
}