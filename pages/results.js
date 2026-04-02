import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAssessment } from '../contexts/AssessmentContext';
import Layout from '../components/layout/Layout';
import Results from '../components/assessment/Results';

export default function ResultsPage() {
  const router = useRouter();
  const { stage, results } = useAssessment();
  
  // Redirect to home if results aren't available yet
  useEffect(() => {
  if (stage !== 'results' || results.successRate === undefined || results.successRate === null) {
    router.push('/');
  }
  }, [stage, results, router]);
  
  return (
    <Layout>
      <Head>
        <title>Your Results | TIRA</title>
        <meta name="description" content="View your IT career assessment results and personalized recommendations." />
      </Head>
      
      <div className="container mx-auto px-4 py-4">
        <Results />
      </div>
    </Layout>
  );
}