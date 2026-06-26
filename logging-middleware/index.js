const fs = require('fs');
const path = require('path');

let cachedToken = null;
let tokenExpiresAt = 0;

// Reusable function to fetch the JWT Authorization Token from Affordmed Server
async function getAuthToken() {
  const now = Math.floor(Date.now() / 1000);
  
  // If we have a cached token and it hasn't expired yet (with a 60s buffer), use it
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
    console.log('\x1b[32m[LOGGING-MIDDLEWARE] Successfully authenticated with Affordmed Test Server\x1b[0m');
    return cachedToken;
  } catch (error) {
    console.error('\x1b[31m[LOGGING-MIDDLEWARE] Failed to authenticate with Affordmed Test Server:\x1b[0m', error.message);
    throw error;
  }
}

// Log(stack, level, package, message)
async function Log(stack, level, packageName, message) {
  // Validate stacks & levels based on specifications
  const validStacks = ["backend", "frontend"];
  const validLevels = ["debug", "info", "warn", "error", "fatal"];
  
  // Validate packages based on stack & spec sheet
  const backendPackages = ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"];
  const frontendPackages = ["api", "component", "hook", "page", "state", "style"];
  const sharedPackages = ["auth", "config", "middleware", "utils"];
  
  const validPackages = [...sharedPackages];
  if (stack === "backend") validPackages.push(...backendPackages);
  if (stack === "frontend") validPackages.push(...frontendPackages);

  const normalizedStack = stack.toLowerCase();
  const normalizedLevel = level.toLowerCase();
  const normalizedPackage = packageName.toLowerCase();

  if (!validStacks.includes(normalizedStack)) {
    console.error(`[LOGGING-MIDDLEWARE ERROR] Invalid stack: ${stack}`);
    return;
  }
  if (!validLevels.includes(normalizedLevel)) {
    console.error(`[LOGGING-MIDDLEWARE ERROR] Invalid level: ${level}`);
    return;
  }
  if (!validPackages.includes(normalizedPackage)) {
    console.error(`[LOGGING-MIDDLEWARE ERROR] Invalid package for stack ${stack}: ${packageName}`);
    return;
  }

  // Attempt to submit log to Affordmed Test Server
  try {
    const token = await getAuthToken();
    
    // Truncate message to 48 characters maximum per test server constraints
    const safeMessage = message.length > 48 ? message.slice(0, 45) + "..." : message;

    const payload = {
      stack: normalizedStack,
      level: normalizedLevel,
      package: normalizedPackage,
      message: safeMessage
    };

    const res = await fetch('http://4.224.186.213/evaluation-service/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[LOGGING-MIDDLEWARE] Log API error ${res.status}: ${errText}`);
      if (res.status === 401) {
        cachedToken = null; // Clear token if unauthorized, triggers refetch next time
      }
    } else {
      const data = await res.json();
      console.log(`\x1b[32m[AFFORDMED LOG SENT]\x1b[0m ID: ${data.logID} | ${normalizedLevel.toUpperCase()} | ${normalizedStack}/${normalizedPackage} | ${message}`);
    }
  } catch (error) {
    console.error('[LOGGING-MIDDLEWARE] Failed to post log to Affordmed:', error.message);
  }

  // File Logging for local audit
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${normalizedStack.toUpperCase()}] [${normalizedLevel.toUpperCase()}] [${normalizedPackage}] ${message}\n`;
  const logFilePath = path.join(process.cwd(), 'requests.log');
  
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('[LOGGING-MIDDLEWARE] Failed to write local log file:', err);
    }
  });
}

// Request logging middleware for Express
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const statusCode = res.statusCode;
    const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;
    
    let level = 'info';
    if (statusCode >= 500) {
      level = 'fatal';
    } else if (statusCode >= 400) {
      level = 'error';
    } else if (statusCode >= 300) {
      level = 'warn';
    }

    Log('backend', level, 'route', message);
  });

  next();
}

module.exports = {
  Log,
  requestLogger
};
