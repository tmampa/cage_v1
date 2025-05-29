# EmailJS Template Configuration Fix

## The Problem
Error: "The recipients address is empty" (HTTP 422)

## The Solution
You need to configure the EmailJS template with a recipient email address.

## Step-by-Step Fix

### 1. Go to EmailJS Dashboard
- Open: https://www.emailjs.com/
- Login to your account
- Navigate to: **Email Templates**

### 2. Find Your Template
- Look for template ID: `template_b4ile1p`
- Click to edit it

### 3. Template Settings (CRITICAL!)
In the template settings section (not the email body), set:

```
To Email: your-email@gmail.com        ← PUT YOUR REAL EMAIL HERE
From Name: {{from_name}}
Reply To: {{reply_to}}
Subject: CAGE Game Feedback - {{feedback_type}} from {{from_name}}
```

### 4. Template Body
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

### 5. Save and Test
- Save the template
- Test using the debug page: http://localhost:3001/debug-emailjs

## Visual Reference

```
EmailJS Template Settings:
┌─────────────────────────────────┐
│ To Email: developer@gmail.com   │ ← YOUR REAL EMAIL
│ From Name: {{from_name}}        │
│ Reply To: {{reply_to}}          │
│ Subject: CAGE Game Feedback...  │
└─────────────────────────────────┘

Template Body:
┌─────────────────────────────────┐
│ <h2>New Feedback...</h2>        │
│ {{from_name}} {{message}} etc.  │
└─────────────────────────────────┘
```

## Important Notes

❌ **WRONG:** Setting "To Email" to `{{to_email}}` or leaving it empty
✅ **CORRECT:** Setting "To Email" to your actual email address

The error occurs because EmailJS needs to know WHERE to send the email, and this must be configured in the template settings, not passed as a parameter.
