# EmailJS Setup Guide for Feedback System

## Overview
The feedback system in the CAGE game uses EmailJS to send user feedback directly to the developer's email. This guide will help you set up EmailJS to receive feedback emails.

## Step 1: Create an EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create an Email Service

1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID** (e.g., `service_abc123`)

## Step 3: Create an Email Template

1. Go to "Email Templates" in your dashboard
2. Click "Create New Template"
3. **IMPORTANT:** Set the "To Email" field to your actual email address (e.g., `your-email@gmail.com`)
4. Use this template content:

### Template Subject:
```
CAGE Game Feedback - {{feedback_type}} from {{from_name}}
```

### Template Body:
```html
<h2>New Feedback from CAGE Game</h2>

<p><strong>From:</strong> {{from_name}} ({{from_email}})</p>
<p><strong>User ID:</strong> {{user_id}}</p>
<p><strong>User Score:</strong> {{user_score}}</p>
<p><strong>Feedback Type:</strong> {{feedback_type}}</p>
<p><strong>Rating:</strong> {{rating}}/5 stars</p>
<p><strong>Date:</strong> {{timestamp}}</p>

<h3>Message:</h3>
<p>{{message}}</p>

---
<p><small>This email was sent automatically from the CAGE game feedback system.</small></p>
```

### Template Settings:
- **To Email:** Set this to your actual email address (this fixes the "recipients address is empty" error)
- **From Name:** {{from_name}}
- **Reply To:** {{from_email}}

5. Save the template and note down your **Template ID** (e.g., `template_xyz789`)

## Step 4: Get Your Public Key

1. Go to "Account" in your EmailJS dashboard
2. Find your **Public Key** (e.g., `user_abcdef123456`)

## Step 5: Update Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values with your actual EmailJS credentials:

```bash
# EmailJS configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_actual_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_actual_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_actual_public_key
```

## Step 6: Update Developer Email (Optional)

1. Open `components/FeedbackButton.js`
2. Find this line around line 40:
```javascript
to_email: 'developer@cage-game.com', // Replace with your actual email
```
3. Replace `developer@cage-game.com` with your actual email address

## Step 7: Test the Feedback System

1. Start your development server: `npm run dev`
2. Navigate to the game
3. Click the floating feedback button (bottom right)
4. Fill out and submit a test feedback
5. Check your email for the feedback message

## Important Notes

- EmailJS free tier allows 200 emails per month
- Keep your credentials secure - they're already configured as environment variables
- The feedback button appears on both the levels page and the game play page
- Users can submit feedback with ratings, categories (bug, feature, general), and detailed messages

## Troubleshooting

### Common Issues:

1. **"Invalid template" error**: Check that your template ID is correct and the template exists
2. **"Invalid service" error**: Verify your service ID and that the email service is properly configured
3. **"Invalid public key" error**: Ensure your public key is correct and active
4. **"The recipients address is empty" error**: 
   - This is the most common error!
   - Go to your EmailJS template settings
   - Make sure the "To Email" field is set to your actual email address
   - Do NOT use template variables like {{to_email}} in the "To Email" field
   - Use a hard-coded email address like: `your-email@gmail.com`
5. **No emails received**: Check your spam folder and verify the email address in your EmailJS service

### Testing Tips:

- Use the debug page at `/debug-emailjs` to test different parameter configurations
- Use the browser console to see detailed error messages
- Test with different feedback types and ratings
- Verify that user information is correctly populated in emails

### Debug Pages Available:

- `/debug-emailjs` - Comprehensive EmailJS testing tool
- `/simple-email-test` - Basic email sending test
- `/test-emailjs` - Original test page

## Security Note

The EmailJS public key is safe to expose in client-side code as it's designed for this purpose. However, never expose your private key or other sensitive EmailJS credentials.
