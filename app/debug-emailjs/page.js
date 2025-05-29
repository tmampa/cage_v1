'use client';

import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

export default function DebugEmailJS() {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, success, message, details = null) => {
    setResults(prev => [...prev, { test, success, message, details, timestamp: new Date().toLocaleString() }]);
  };

  const runFullTest = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Environment Variables
    addResult(
      'Environment Variables',
      !!(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID && process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID && process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY),
      `Service ID: ${process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ? '✓' : '✗'}, Template ID: ${process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ? '✓' : '✗'}, Public Key: ${process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '✓' : '✗'}`,
      {
        serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      }
    );

    // Test 2: EmailJS Initialization
    try {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
      addResult('EmailJS Initialization', true, 'EmailJS initialized successfully');
    } catch (error) {
      addResult('EmailJS Initialization', false, `Failed to initialize: ${error.message}`, error);
    }

    // Test 3: Basic Email Send (Minimal Parameters)
    const minimalParams = {
      to_name: 'Developer',
      from_name: 'Test User',
      message: 'Minimal test message'
    };

    try {
      const result1 = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        minimalParams
      );

      addResult('Minimal Email Test', true, `Success: ${result1.text} (Status: ${result1.status})`, minimalParams);
    } catch (error) {
      addResult('Minimal Email Test', false, `Failed: ${error.text || error.message || 'Unknown error'}`, { error, params: minimalParams });
    }

    // Test 4: Full Email Send (All Parameters)
    const fullParams = {
      to_name: 'CAGE Game Developer',
      to_email: 'developer@cage-game.com',
      from_name: 'Test User',
      from_email: 'test@example.com',
      reply_to: 'test@example.com',
      subject: 'Test Email from CAGE Game',
      message: 'This is a full test with all parameters',
      feedback_type: 'test',
      rating: 5,
      user_id: 'test-123',
      timestamp: new Date().toLocaleString()
    };

    try {
      const result2 = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        fullParams
      );

      addResult('Full Email Test', true, `Success: ${result2.text} (Status: ${result2.status})`, fullParams);
    } catch (error) {
      addResult('Full Email Test', false, `Failed: ${error.text || error.message || 'Unknown error'}`, { error, params: fullParams });
    }

    // Test 5: Alternative Parameter Names
    const altParams = {
      user_name: 'Test User',
      user_email: 'test@example.com',
      message: 'Alternative parameter names test'
    };

    try {
      const result3 = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        altParams
      );

      addResult('Alternative Parameters Test', true, `Success: ${result3.text} (Status: ${result3.status})`, altParams);
    } catch (error) {
      addResult('Alternative Parameters Test', false, `Failed: ${error.text || error.message || 'Unknown error'}`, { error, params: altParams });
    }

    setTesting(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px' }}>
      <h1>EmailJS Debug Tool</h1>
      
      <button 
        onClick={runFullTest}
        disabled={testing}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: testing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {testing ? 'Running Tests...' : 'Run Full EmailJS Test'}
      </button>

      <div style={{ marginTop: '20px' }}>
        {results.map((result, index) => (
          <div key={index} style={{
            marginBottom: '15px',
            padding: '15px',
            border: `2px solid ${result.success ? '#28a745' : '#dc3545'}`,
            borderRadius: '8px',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da'
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: result.success ? '#155724' : '#721c24' 
            }}>
              {result.success ? '✅' : '❌'} {result.test}
            </h3>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              {result.message}
            </p>
            {result.details && (
              <details>
                <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                  View Details
                </summary>
                <pre style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
            <small style={{ color: '#666' }}>
              {result.timestamp}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
