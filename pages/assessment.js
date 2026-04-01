import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAssessment } from '../contexts/AssessmentContext';
import Layout from '../components/layout/Layout';
import BiodataForm from '../components/assessment/BiodataForm';
import RoleSelection from '../components/assessment/RoleSelection';
import QuestionBatch from '../components/assessment/QuestionBatch';

export default function Assessment() {
  const router = useRouter();
  const { stage } = useAssessment();
  
  // Redirect to results page when assessment is complete
  useEffect(() => {
    if (stage === 'results') {
      router.push('/results');
    }
  }, [stage, router]);
  
  // Determine which component to render based on current stage
  const renderStageComponent = () => {
    switch (stage) {
      case 'biodata':
        return <BiodataForm />;
      case 'roleSelection':
        return <RoleSelection />;
      case 'aptitudeQuestions':
      case 'generalQuestions':
      case 'roleQuestions':
        return <QuestionBatch />;
      default:
        // If we're not at any of these stages, redirect back to home
        if (typeof window !== 'undefined') {
          router.push('/');
        }
        return null;
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Assessment | IT Career Assessment</title>
        <meta name="description" content="Take your IT career assessment to discover your potential." />
      </Head>
      
      <div className="container mx-auto px-4 py-12 pb-32 sm:pb-24">

        {renderStageComponent()}
      </div>
    </Layout>
  );
}