// api/contact.js - Contact form handler
import { Resend } from 'resend';
import { cors } from '../lib/auth.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, type, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const typeLabels = {
    bug: '🐛 Bug Report',
    feedback: '💡 Feedback',
    question: '❓ Question',
    partnership: '🤝 Partnership',
    other: '📩 Other'
  };

  const subject = `[ClaudeSim] ${typeLabels[type] || '📩 Contact'} from ${name}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'ClaudeSim <noreply@bizsimlive.com>',
      to: 'sylgauthier@gmail.com',
      replyTo: email,
      subject,
      html: `
        <h2>${typeLabels[type] || 'Contact Form'}</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Type:</strong> ${type || 'general'}</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color:#888;font-size:12px;">Sent from ClaudeSim contact form</p>
      `
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return res.status(500).json({ error: 'Failed to send: ' + (error.message || JSON.stringify(error)) });
    }

    console.log('Email sent:', JSON.stringify(data));
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
