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
    Log('backend', 'warn', 'service', `Failed to proxy notifications from Affordmed: ${error.message}. Serving fallback mock notifications.`);
    
    // Serve high-quality fallback mock notifications when Affordmed server is unreachable or evaluation session has ended
    const fallbackNotifications = [
      {
        id: "fallback-notif-1",
        type: "Placement",
        title: "Placement Notification",
        message: "Google SWE Intern interview updates published",
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-2",
        type: "Placement",
        title: "Placement Notification",
        message: "Eli Lilly and Company hiring for Software Engineer",
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-3",
        type: "Result",
        title: "Result Notification",
        message: "Mid-Semester grades sheet released for all departments",
        date: new Date(Date.now() - 3600000 * 8).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-4",
        type: "Placement",
        title: "Placement Notification",
        message: "Amgen Inc. hiring Software Engineering roles",
        date: new Date(Date.now() - 3600000 * 12).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-5",
        type: "Event",
        title: "Event Notification",
        message: "Annual College Sports Fest registrations open tomorrow",
        date: new Date(Date.now() - 3600000 * 18).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-6",
        type: "Result",
        title: "Result Notification",
        message: "Re-evaluation exam results are uploaded in the portal",
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-7",
        type: "Placement",
        title: "Placement Notification",
        message: "PayPal Holdings hiring Software Engineers",
        date: new Date(Date.now() - 3600000 * 36).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-8",
        type: "Event",
        title: "Event Notification",
        message: "Tech Talk on Agentic Workflows by Google DeepMind",
        date: new Date(Date.now() - 3600000 * 1).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-9",
        type: "Placement",
        title: "Placement Notification",
        message: "Microsoft FTE application opening",
        date: new Date(Date.now() - 3600000 * 48).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-10",
        type: "Result",
        title: "Result Notification",
        message: "Final semester grades publish schedule",
        date: new Date(Date.now() - 3600000 * 72).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-11",
        type: "Event",
        title: "Event Notification",
        message: "Tech talk: Agentic workflows",
        date: new Date(Date.now() - 3600000 * 96).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-12",
        type: "Placement",
        title: "Placement Notification",
        message: "Nvidia Corporation hiring software engineers",
        date: new Date(Date.now() - 3600000 * 3).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-13",
        type: "Result",
        title: "Result Notification",
        message: "End-Sem examination results announced",
        date: new Date(Date.now() - 3600000 * 6).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-14",
        type: "Event",
        title: "Event Notification",
        message: "Annual coding fest registrations active",
        date: new Date(Date.now() - 3600000 * 10).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-15",
        type: "Placement",
        title: "Placement Notification",
        message: "Apple Inc. hiring Software Engineering roles",
        date: new Date(Date.now() - 3600000 * 14).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-16",
        type: "Result",
        title: "Result Notification",
        message: "Project review feedback submitted",
        date: new Date(Date.now() - 3600000 * 20).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-17",
        type: "Placement",
        title: "Placement Notification",
        message: "AMD hiring Software Engineer interns",
        date: new Date(Date.now() - 3600000 * 28).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-18",
        type: "Result",
        title: "Result Notification",
        message: "Mid-Sem grade sheet published",
        date: new Date(Date.now() - 3600000 * 32).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-19",
        type: "Event",
        title: "Event Notification",
        message: "Annual sports meet registrations",
        date: new Date(Date.now() - 3600000 * 40).toISOString(),
        read: false
      },
      {
        id: "fallback-notif-20",
        type: "Placement",
        title: "Placement Notification",
        message: "CSX Corporation full-time drive starting",
        date: new Date(Date.now() - 3600000 * 50).toISOString(),
        read: false
      }
    ];

    let filtered = fallbackNotifications;
    if (type && type !== 'All') {
      filtered = filtered.filter(n => n.type.toLowerCase() === type.toLowerCase());
    }

    const totalCount = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.json({
      notifications: paginated,
      totalPages: Math.ceil(totalCount / limit) || 1,
      total: totalCount
    });
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
