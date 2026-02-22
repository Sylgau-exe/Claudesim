// api/stripe/webhook.js - Handle Stripe webhooks for ClaudeSim
import { sql } from '@vercel/postgres';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe requires raw body for signature verification
export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) { chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk); }
  return Buffer.concat(chunks);
}

function verifySignature(payload, sig, secret) {
  const crypto = require('crypto');
  const elements = sig.split(',');
  const timestamp = elements.find(e => e.startsWith('t=')).substring(2);
  const signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.substring(3));
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return signatures.some(s => crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const buf = await buffer(req);
  const rawBody = buf.toString('utf8');
  const sig = req.headers['stripe-signature'];

  // Verify webhook signature
  if (STRIPE_WEBHOOK_SECRET && sig) {
    try {
      if (!verifySignature(rawBody, sig, STRIPE_WEBHOOK_SECRET)) {
        console.error('Webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } catch (err) {
      console.error('Signature error:', err);
      return res.status(400).json({ error: 'Signature verification failed' });
    }
  }

  const event = JSON.parse(rawBody);
  console.log(`Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      // Successful payment (one-time or first subscription)
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || session.customer_details?.email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const mode = session.mode; // 'payment' or 'subscription'

        if (email) {
          const plan = mode === 'subscription' ? 'pro_monthly' : 'pro_lifetime';
          const limit = mode === 'subscription' ? 10 : 20;

          await sql`
            UPDATE users SET
              plan = ${plan},
              simulations_limit = ${limit},
              simulations_used = 0,
              stripe_customer_id = ${customerId},
              stripe_subscription_id = ${subscriptionId},
              updated_at = CURRENT_TIMESTAMP
            WHERE email = ${email.toLowerCase()}
          `;
          console.log(`User ${email} upgraded to ${plan}`);
        }
        break;
      }

      // Subscription renewed
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        if (invoice.billing_reason === 'subscription_cycle') {
          await sql`
            UPDATE users SET
              simulations_used = 0,
              updated_at = CURRENT_TIMESTAMP
            WHERE stripe_customer_id = ${customerId}
          `;
          console.log(`Subscription renewed for customer ${customerId}, usage reset`);
        }
        break;
      }

      // Subscription cancelled
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;
        await sql`
          UPDATE users SET
            plan = 'free',
            simulations_limit = 1,
            stripe_subscription_id = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_customer_id = ${customerId}
        `;
        console.log(`Subscription cancelled for ${customerId}, downgraded to free`);
        break;
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn(`Payment failed for customer ${invoice.customer}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
