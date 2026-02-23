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
    await resend.emails.send({
      from: 'ClaudeSim <noreply@pandaprojet.com>',
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

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
