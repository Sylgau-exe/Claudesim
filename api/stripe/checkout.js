// api/stripe/checkout.js - Create Stripe Checkout Session (server-side)
import Stripe from 'stripe';
import { getUserFromRequest, cors } from '../../lib/auth.js';
import { UserDB } from '../../lib/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  pro_monthly: 'price_1T3ltn2F7BCAvuz0c0bi5kVB',
  pro_lifetime: 'price_1T3luC2F7BCAvuz0oStYkdjJ'
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  const { plan } = req.body;
  if (!plan || !PRICE_IDS[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const user = await UserDB.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const frontendUrl = process.env.FRONTEND_URL || 'https://claudesim.app';

    const sessionConfig = {
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      mode: plan === 'pro_monthly' ? 'subscription' : 'payment',
      customer_email: user.email,
      success_url: `${frontendUrl}/dashboard?payment=success`,
      cancel_url: `${frontendUrl}/#pricing`,
      metadata: {
        userId: user.id.toString(),
        plan: plan
      }
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session: ' + err.message });
  }
}
