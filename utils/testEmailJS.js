// Test EmailJS Configuration
// This file can be used to test EmailJS setup independently

import emailjs from '@emailjs/browser';

export const testEmailJSConfig = () => {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  console.log('EmailJS Configuration Test:');
  console.log('Service ID:', serviceId ? '✓ Set' : '✗ Missing');
  console.log('Template ID:', templateId ? '✓ Set' : '✗ Missing');
  console.log('Public Key:', publicKey ? '✓ Set' : '✗ Missing');

  if (!serviceId || !templateId || !publicKey) {
    console.error('❌ EmailJS configuration is incomplete');
    return false;
  }

  console.log('✅ EmailJS configuration appears complete');
  return true;
};

export const sendTestEmail = async () => {
  const templateParams = {
    from_name: 'Test User',
    from_email: 'test@example.com',
    user_id: 'test-123',
    feedback_type: 'Test',
    rating: 5,
    message: 'This is a test message from the CAGE feedback system.',
    timestamp: new Date().toLocaleString(),
    user_score: 100,
    to_email: 'developer@cage-game.com',
  };

  try {
    const result = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    );
    
    console.log('✅ Test email sent successfully:', result.text);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return { success: false, error };
  }
};
