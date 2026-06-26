export async function Log(level, packageName, message) {
  try {
    await fetch('http://localhost:5000/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stack: 'frontend',
        level: level.toLowerCase(),
        package: packageName.toLowerCase(),
        message: message
      })
    });
  } catch (error) {
    console.error('Failed to proxy frontend log:', error);
  }
}
