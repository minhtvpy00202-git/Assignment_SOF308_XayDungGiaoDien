const fs = require('fs');

// Read the current db.json
const dbPath = './db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Update users with online status
db.users = db.users.map(user => ({
  ...user,
  isOnline: Math.random() > 0.5, // Random online status for demo
  lastSeen: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString() // Random last seen within last hour
}));

// Write back to db.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('Updated users with online status');