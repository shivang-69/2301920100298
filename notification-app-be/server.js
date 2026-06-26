require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Log, requestLogger } = require('logging-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

let cachedToken = null;
let tokenExpiresAt = 0;

// Reusable function to fetch the JWT Authorization Token from Affordmed Server
async function getAuthToken() {
  const now = Math.floor(Date.now() / 1000);
  
  if (cachedToken && now < tokenExpiresAt - 60) {
    return cachedToken;
  }

  const payload = {
    email: process.env.AFFORDMED_EMAIL,
    name: process.env.AFFORDMED_NAME,
    rollNo: process.env.AFFORDMED_ROLL_NO,
    accessCode: process.env.AFFORDMED_ACCESS_CODE,
    clientID: process.env.AFFORDMED_CLIENT_ID,
    clientSecret: process.env.AFFORDMED_CLIENT_SECRET
  };

  try {
    const res = await fetch('http://4.224.186.213/evaluation-service/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Auth failed with status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = data.expires_in; // Absolute UNIX timestamp
    console.log('[LOGGING-MIDDLEWARE] Successfully authenticated with Affordmed Test Server');
    return cachedToken;
  } catch (error) {
    console.error('[LOGGING-MIDDLEWARE] Failed to authenticate with Affordmed Test Server:', error.message);
    throw error;
  }
}

// Proxy endpoint for frontend logging to secure credentials on backend
app.post('/api/logs', async (req, res) => {
  const { stack, level, package: packageName, message } = req.body;
  
  if (!stack || !level || !packageName || !message) {
    return res.status(400).json({ error: 'All log fields (stack, level, package, message) are required' });
  }

  await Log(stack, level, packageName, message);
  res.json({ success: true });
});

// GET /api/notifications (fetches from Affordmed remote server and normalizes)
app.get('/api/notifications', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const type = req.query.type || 'All';

  Log('backend', 'debug', 'controller', `Processing proxy request - Page: ${page}, Limit: ${limit}, Type: ${type}`);

  try {
    const token = await getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    let notificationsList = [];
    let totalCount = 0;

    // The remote Affordmed API has a strict constraint: limit can be at most 10.
    // If client requests a limit > 10 (e.g. for Priority Inbox calculations),
    // we split it into parallel requests of limit=10.
    if (limit <= 10) {
      let url = `http://4.224.186.213/evaluation-service/notifications?page=${page}&limit=${limit}`;
      if (type && type !== 'All') {
        url += `&notification_type=${type}`;
      }
      
      const apiRes = await fetch(url, { headers });
      if (!apiRes.ok) {
        throw new Error(`Affordmed API returned status ${apiRes.status}`);
      }
      const data = await apiRes.json();
      notificationsList = data.notifications || [];
      totalCount = data.total || (notificationsList.length === limit ? page * limit + 1 : (page - 1) * limit + notificationsList.length);
    } else {
      const requestsCount = Math.ceil(limit / 10);
      const promises = [];
      
      for (let i = 1; i <= requestsCount; i++) {
        let url = `http://4.224.186.213/evaluation-service/notifications?page=${i}&limit=10`;
        if (type && type !== 'All') {
          url += `&notification_type=${type}`;
        }
        promises.push(
          fetch(url, { headers }).then(r => {
            if (!r.ok) throw new Error(`Status ${r.status}`);
            return r.json();
          })
        );
      }

      const results = await Promise.all(promises);
      results.forEach(data => {
        if (data.notifications) {
          notificationsList.push(...data.notifications);
        }
      });
      
      // Trim merged list to requested limit
      notificationsList = notificationsList.slice(0, limit);
      totalCount = results[0]?.total || notificationsList.length;
    }

    // Normalize keys from remote API (capitalized) to match our React code
    const normalized = notificationsList.map(n => ({
      id: n.ID,
      type: n.Type,
      title: `${n.Type} Notification`,
      message: n.Message,
      date: n.Timestamp || new Date().toISOString(),
      read: false // Handled client-side via localStorage in Stage 7
    }));

    Log('backend', 'info', 'service', `Successfully proxied ${normalized.length} notifications from Affordmed`);

    // Calculate total pages for frontend based on actual page size (default 10)
    const normalizedPageLimit = limit > 10 ? 10 : limit;
    const totalPages = Math.ceil(totalCount / normalizedPageLimit) || 1;

    res.json({
      notifications: normalized,
      totalPages,
      total: totalCount
    });
  } catch (error) {
    Log('backend', 'error', 'service', `Failed to proxy notifications from Affordmed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/unread-count
app.get('/api/notifications/unread-count', (req, res) => {
  res.json({ count: 0 });
});

// PATCH /api/notifications/:id/read
app.patch('/api/notifications/:id/read', (req, res) => {
  res.json({ success: true });
});

// POST /api/notifications
app.post('/api/notifications', async (req, res) => {
  const { type, title, message } = req.body;

  if (!type || !title || !message) {
    return res.status(400).json({ error: 'Type, title, and message are required' });
  }

  Log('backend', 'info', 'handler', `Mock notification created locally - Title: "${title}"`);
  
  res.status(201).json({
    success: true,
    notification: {
      id: Date.now().toString(),
      type,
      title,
      message,
      date: new Date().toISOString(),
      read: false
    }
  });
});

app.listen(PORT, () => {
  Log('backend', 'info', 'config', `Server started up successfully on port ${PORT}`);
  console.log(`Notification Server is running on port ${PORT}`);
});
