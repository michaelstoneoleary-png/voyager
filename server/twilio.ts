// Twilio integration via Replit Connectors with Auth Token fallback
import twilio from 'twilio';

let connectionSettings: any;
let cachedCredentials: any = null;

async function getConnectorCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    if (!connectionSettings?.settings?.account_sid) {
      return null;
    }
    return {
      accountSid: connectionSettings.settings.account_sid,
      apiKey: connectionSettings.settings.api_key,
      apiKeySecret: connectionSettings.settings.api_key_secret,
      phoneNumber: connectionSettings.settings.phone_number
    };
  } catch {
    return null;
  }
}

async function getCredentials() {
  if (cachedCredentials) return cachedCredentials;

  const connectorCreds = await getConnectorCredentials();

  if (connectorCreds?.accountSid) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (authToken) {
      cachedCredentials = {
        accountSid: connectorCreds.accountSid,
        authToken,
        phoneNumber: connectorCreds.phoneNumber,
        mode: 'auth_token'
      };
      return cachedCredentials;
    }

    if (connectorCreds.apiKey && connectorCreds.apiKeySecret) {
      cachedCredentials = {
        accountSid: connectorCreds.accountSid,
        apiKey: connectorCreds.apiKey,
        apiKeySecret: connectorCreds.apiKeySecret,
        phoneNumber: connectorCreds.phoneNumber,
        mode: 'api_key'
      };
      return cachedCredentials;
    }
  }

  throw new Error('Twilio not configured. Please set up the Twilio connection or provide TWILIO_AUTH_TOKEN.');
}

export async function getTwilioClient() {
  const creds = await getCredentials();
  if (creds.mode === 'auth_token') {
    return twilio(creds.accountSid, creds.authToken);
  }
  return twilio(creds.apiKey, creds.apiKeySecret, {
    accountSid: creds.accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const creds = await getCredentials();
  return creds.phoneNumber;
}

export async function sendSms(to: string, body: string) {
  const client = await getTwilioClient();
  const from = await getTwilioFromPhoneNumber();
  if (!from) {
    throw new Error('No Twilio phone number configured');
  }
  const message = await client.messages.create({
    to,
    from,
    body,
  });
  return message.sid;
}
