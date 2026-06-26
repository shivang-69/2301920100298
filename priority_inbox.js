/**
 * Stage 6: Priority Inbox Algorithm
 * Weight Ranking: Placement (3) > Result (2) > Event (1)
 * Secondary Sorting: Recency (Timestamp DESC)
 */

const typeWeights = {
  "Placement": 3,
  "Result": 2,
  "Event": 1
};

/**
 * Sorts and extracts the top 'n' priority notifications.
 * @param {Array} notifications - List of notifications
 * @param {number} n - Number of items to return
 * @returns {Array} - Top 'n' sorted notifications
 */
function getPriorityNotifications(notifications, n = 10) {
  return [...notifications].sort((a, b) => {
    const weightA = typeWeights[a.Type] || 0;
    const weightB = typeWeights[b.Type] || 0;

    // Primary sorting: Higher weight first
    if (weightA !== weightB) {
      return weightB - weightA;
    }

    // Secondary sorting: Newer timestamp first
    const dateA = new Date(a.Timestamp.replace(' ', 'T'));
    const dateB = new Date(b.Timestamp.replace(' ', 'T'));
    return dateB - dateA;
  }).slice(0, n);
}

// Sample test mock notifications from Affordmed evaluation structure
const mockNotifications = [
  {
    "ID": "notif-1",
    "Type": "Result",
    "Message": "Mid-Sem grade sheet published",
    "Timestamp": "2026-04-22 17:51:30"
  },
  {
    "ID": "notif-2",
    "Type": "Placement",
    "Message": "AMD hiring Software Engineer interns",
    "Timestamp": "2026-04-22 17:49:42"
  },
  {
    "ID": "notif-3",
    "Type": "Event",
    "Message": "Annual coding fest registrations active",
    "Timestamp": "2026-04-22 17:50:06"
  },
  {
    "ID": "notif-4",
    "Type": "Result",
    "Message": "Project review feedback submitted",
    "Timestamp": "2026-04-22 17:50:42"
  },
  {
    "ID": "notif-5",
    "Type": "Placement",
    "Message": "CSX Corporation full-time drive starting",
    "Timestamp": "2026-04-22 17:51:18"
  },
  {
    "ID": "notif-6",
    "Type": "Event",
    "Message": "Annual sports meet registrations",
    "Timestamp": "2026-04-22 17:45:00"
  },
  {
    "ID": "notif-7",
    "Type": "Placement",
    "Message": "Google SWE Intern job opening",
    "Timestamp": "2026-04-22 17:55:00" // Newest placement
  },
  {
    "ID": "notif-8",
    "Type": "Result",
    "Message": "Final semester grades publish schedule",
    "Timestamp": "2026-04-22 17:58:00" // Newest result
  },
  {
    "ID": "notif-9",
    "Type": "Event",
    "Message": "Tech talk: Agentic workflows",
    "Timestamp": "2026-04-22 17:59:00" // Newest event
  },
  {
    "ID": "notif-10",
    "Type": "Placement",
    "Message": "Microsoft FTE application opening",
    "Timestamp": "2026-04-22 17:40:00" // Oldest placement
  },
  {
    "ID": "notif-11",
    "Type": "Result",
    "Message": "Re-evaluation exam results",
    "Timestamp": "2026-04-22 17:35:00"
  }
];

// Execution and verification display
console.log("\n=================== ALL NOTIFICATIONS ===================");
mockNotifications.forEach(n => console.log(`[${n.Type}] - ${n.Timestamp} - ${n.Message}`));

const top10 = getPriorityNotifications(mockNotifications, 10);

console.log("\n========= TOP 10 PRIORITY NOTIFICATIONS (SORTED) =========");
top10.forEach((n, i) => {
  console.log(`${i + 1}. [${n.Type}] - ${n.Timestamp} - ${n.Message}`);
});
console.log("=========================================================\n");

module.exports = { getPriorityNotifications };
