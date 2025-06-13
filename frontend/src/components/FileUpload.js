import React, { useState, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FileUpload = ({ onAnalysisComplete, onAnalysisError, loading, setLoading }) => {
  const [stanFile, setStanFile] = useState(null);
  const [stripeFile, setStripeFile] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleFileSelect = (file, type) => {
    if (file && file.type === 'text/csv') {
      if (type === 'stan') {
        setStanFile(file);
      } else {
        setStripeFile(file);
      }
    } else {
      onAnalysisError('Please select a valid CSV file.');
    }
  };

  const handleDragOver = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(type);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(null);
  }, []);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0], type);
    }
  }, []);

  const handleSubmit = async () => {
    if (!stanFile) {
      onAnalysisError('Please upload at least a Stan Store CSV file.');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('stan_file', stanFile);
      
      if (stripeFile) {
        formData.append('stripe_file', stripeFile);
      }

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze files');
      }

      const data = await response.json();
      onAnalysisComplete(data);
      
    } catch (error) {
      console.error('Analysis error:', error);
      onAnalysisError(error.message || 'Failed to analyze files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FileDropZone = ({ type, file, title, description, required = false }) => {
    const isDragOver = dragOver === type;
    
    return (
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={(e) => handleDragOver(e, type)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, type)}
      >
        <div className="text-center">
          <div className="mx-auto mb-4">
            {file ? (
              <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          {file ? (
            <div className="bg-white rounded-md p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                </div>
                <button
                  onClick={() => type === 'stan' ? setStanFile(null) : setStripeFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect(e.target.files[0], type)}
                  className="hidden"
                />
                <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Choose CSV File
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2">or drag and drop</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <FileDropZone
          type="stan"
          file={stanFile}
          title="Stan Store Export"
          description="Upload your Stan Store sales CSV export file"
          required={true}
        />
        
        <FileDropZone
          type="stripe"
          file={stripeFile}
          title="Stripe Export (Optional)"
          description="Upload your Stripe payments CSV for enhanced analytics"
        />
      </div>
      
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!stanFile || loading}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-colors duration-200 ${
            !stanFile || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Data...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyze Data
            </>
          )}
        </button>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Your data is processed securely and never stored on our servers.</p>
      </div>
    </div>
  );
};

export default FileUpload;