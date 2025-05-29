'use client';

import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

export default function QuickEmailTest() {
  const [status, setStatus] = useState('Ready to test');
  const [loading, setLoading] = useState(false);

  const quickTest = async () => {
    setLoading(true);
    setStatus('Sending test email...');

    try {
      // Initialize EmailJS
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
      
      // Send with minimal parameters
      const result = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        {
          from_name: 'Quick Test',
          from_email: 'test@example.com',
          reply_to: 'test@example.com',
          message: 'This is a quick test to verify EmailJS is working!',
          feedback_type: 'test',
          rating: 5,
          user_id: 'test-user',
          timestamp: new Date().toLocaleString(),
          user_score: 100
        }
      );
      
      setStatus(`✅ SUCCESS! Email sent. Status: ${result.status}, Response: ${result.text}`);
    } catch (error) {
      setStatus(`❌ FAILED: ${error.text || error.message || 'Unknown error'}`);
      console.error('Quick test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333' }}>Quick EmailJS Test</h1>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f0f8ff', 
        border: '1px solid #007bff',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Instructions:</h3>
        <ol style={{ margin: 0, paddingLeft: '20px' }}>
          <li>First, configure your EmailJS template with a recipient email</li>
          <li>Then click the test button below</li>
          <li>Check your email inbox (and spam folder)</li>
        </ol>
      </div>

      <button 
        onClick={quickTest}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Send Test Email'}
      </button>

      <div style={{
        padding: '15px',
        backgroundColor: status.includes('SUCCESS') ? '#d4edda' : 
                         status.includes('FAILED') ? '#f8d7da' : '#f8f9fa',
        border: `1px solid ${status.includes('SUCCESS') ? '#c3e6cb' : 
                             status.includes('FAILED') ? '#f5c6cb' : '#dee2e6'}`,
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Service ID:</strong> {process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID}</p>
        <p><strong>Template ID:</strong> {process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID}</p>
        <p><strong>Public Key:</strong> {process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY}</p>
      </div>
    </div>
  );
}
