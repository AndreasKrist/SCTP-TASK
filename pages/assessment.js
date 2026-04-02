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
  
  // Handle all redirects in useEffect only — never during render
  useEffect(() => {
    if (stage === 'results') {
      router.push('/results');
    } else if (stage === 'welcome') {
      router.push('/');
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
        return null;
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Assessment | TIRA</title>
        <meta name="description" content="Take your IT career assessment to discover your potential." />
      </Head>
      
      <div className="container mx-auto px-4 py-4 pb-8">

        {renderStageComponent()}
      </div>
    </Layout>
  );
}