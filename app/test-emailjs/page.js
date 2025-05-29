'use client';

import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

function EmailJSTest() {
  const [status, setStatus] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Check environment variables
    const emailjsConfig = {
      serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
    };
    
    setConfig(emailjsConfig);
    console.log('EmailJS Config:', emailjsConfig);
    
    // Initialize EmailJS
    if (emailjsConfig.publicKey) {
      emailjs.init(emailjsConfig.publicKey);
      setStatus('EmailJS initialized');
    } else {
      setStatus('EmailJS public key missing');
    }
  }, []);

  const testEmailJS = async () => {
    setStatus('Sending test email...');
    
    try {
      // First, let's try with the exact same parameters as FeedbackButton
      const templateParams = {
        from_name: 'Test User',
        from_email: 'test@example.com',
        user_id: 'test-user-123',
        feedback_type: 'test',
        rating: 5,
        message: 'This is a test message from the debug page',
        timestamp: new Date().toLocaleString(),
        user_score: 100,
        to_email: 'developer@cage-game.com',
      };

      console.log('Sending with template params:', templateParams);
      console.log('Using config:', config);

      const result = await emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams
      );
      
      setStatus(`Success: ${result.text}`);
      console.log('Test email sent:', result);
    } catch (error) {
      setStatus(`Error: ${JSON.stringify(error)}`);
      console.error('Test email failed:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>EmailJS Test Page</h1>
      
      <h2>Configuration:</h2>
      <pre>{JSON.stringify(config, null, 2)}</pre>
      
      <h2>Status:</h2>
      <p>{status}</p>
      
      <button onClick={testEmailJS} disabled={!config.serviceId}>
        Test EmailJS
      </button>
    </div>
  );
}

export default EmailJSTest;
