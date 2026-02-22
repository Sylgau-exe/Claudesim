// api/auth/google/callback.js - Handle Google OAuth callback (from saas-starter-kit)
import { UserDB } from '../../../lib/db.js';
import { generateToken } from '../../../lib/auth.js';

export default async function handler(req, res) {
  const { code, error } = req.query;
  if (error) return res.redirect('/?error=google_auth_failed');
  if (!code) return res.redirect('/?error=no_code');

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const host = req.headers.host;
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}://${host}/api/auth/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) return res.redirect('/?error=token_exchange_failed');

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoResponse.json();
    if (!googleUser.email) return res.redirect('/?error=no_email');

    let user = await UserDB.findByEmail(googleUser.email);
    let isNewUser = false;

    if (!user) {
      user = await UserDB.createGoogleUser(googleUser.email, googleUser.name || googleUser.email.split('@')[0], googleUser.id);
      isNewUser = true;
    } else if (!user.google_id) {
      await UserDB.linkGoogleAccount(user.id, googleUser.id);
    }

    const token = generateToken(user);
    const params = new URLSearchParams({ token });
    if (isNewUser) { params.append('newUser', 'true'); params.append('email', googleUser.email); params.append('name', googleUser.name || ''); }
    res.redirect(`/?${params.toString()}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/?error=auth_failed');
  }
}
