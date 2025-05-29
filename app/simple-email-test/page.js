'use client';

import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

export default function SimpleEmailTest() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testBasicEmail = async () => {
    setLoading(true);
    setMessage('Testing...');

    try {
      // Initialize EmailJS
      emailjs.init('Tq7IpIqe4usFB5uh0');
      
      // Very basic test with standard EmailJS parameters
      const result = await emailjs.send(
        'service_om7bidk',
        'template_b4ile1p',
        {
          to_name: 'CAGE Game Developer',
          to_email: 'developer@cage-game.com',
          from_name: 'Test User',
          from_email: 'test@example.com',
          reply_to: 'test@example.com',
          message: 'Hello from CAGE Game! This is a test message.',
          subject: 'Test Email from CAGE Game'
        }
      );
      
      setMessage(`✅ Success! ${result.text} (Status: ${result.status})`);
    } catch (error) {
      setMessage(`❌ Error: ${error.text || error.message || 'Unknown error'}`);
      console.error('Detailed error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h1>Simple EmailJS Test</h1>
      
      <button 
        onClick={testBasicEmail} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Sending...' : 'Test Email'}
      </button>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontFamily: 'monospace'
      }}>
        {message || 'Click the button to test EmailJS'}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Service ID:</strong> service_om7bidk</p>
        <p><strong>Template ID:</strong> template_b4ile1p</p>
        <p><strong>Public Key:</strong> Tq7IpIqe4usFB5uh0</p>
      </div>
    </div>
  );
}
