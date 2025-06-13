import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import './App.css';

function App() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalysisComplete = (data) => {
    setAnalyticsData(data);
    setError(null);
  };

  const handleAnalysisError = (errorMessage) => {
    setError(errorMessage);
    setAnalyticsData(null);
  };

  const handleReset = () => {
    setAnalyticsData(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!analyticsData ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Stanlytics
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Upload your Stan Store and Stripe CSV files to get detailed analytics 
                about your sales, revenue, and customer insights.
              </p>
            </div>
            
            <FileUpload 
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleAnalysisError}
              loading={loading}
              setLoading={setLoading}
            />
            
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Analysis Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Dashboard 
            data={analyticsData} 
            onReset={handleReset}
          />
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>© 2025 Stanlytics - Analytics for Stan Store Creators</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;