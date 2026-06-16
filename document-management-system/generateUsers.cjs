const fs = require('fs');

const dbPath = './db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Filter out existing users except admin and base user
db.users = db.users.filter(u => u.id === '1' || u.id === '2');

const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Karen', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'];

for (let i = 3; i <= 32; i++) {
  const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const role = Math.random() > 0.8 ? 'admin' : 'user';
  const status = Math.random() > 0.9 ? 'suspended' : 'active';
  const departmentId = Math.random() > 0.5 ? '1' : '2';
  
  // Random past date within last 2 years
  const joinDate = new Date();
  joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 700));
  
  const lastActive = new Date();
  lastActive.setDate(lastActive.getDate() - Math.floor(Math.random() * 30));

  db.users.push({
    id: i.toString(),
    email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@dms.com`,
    password: 'password123',
    firstName: fName,
    lastName: lName,
    role: role,
    departments: [departmentId],
    status: status,
    avatar: null,
    createdAt: joinDate.toISOString(),
    lastActive: lastActive.toISOString()
  });
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Successfully added 30 users to db.json');
