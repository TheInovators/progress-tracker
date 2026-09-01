import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDb } from './db.js';
import User from './models/User.js';
import { refreshStudent } from './routes/students.js';

// Demo roster. The handles are real public accounts so a fresh install shows live
// data on first run instead of an empty grid.
const ROSTER = [
  {
    name: 'Krishna Gupta',
    email: 'krishna@kiet.edu',
    branch: 'IT',
    section: 'B',
    college: 'KIET Group of Institutions',
    isAdmin: true,
    handles: { leetcode: 'votrubac', codeforces: 'tourist', github: 'torvalds' },
  },
  {
    name: 'Kushagra Mishra',
    email: 'kushagra@kiet.edu',
    branch: 'IT',
    section: 'B',
    college: 'KIET Group of Institutions',
    handles: { github: 'gaearon', codechef: 'gennady.korotkevich', gfg: 'gfg_user' },
  },
  {
    name: 'Lalbabu Kumar',
    email: 'lalbabu@kiet.edu',
    branch: 'IT',
    section: 'B',
    college: 'KIET Group of Institutions',
    handles: { codeforces: 'Petr', leetcode: 'lee215', gfg: 'abhinavsingh' },
  },
  {
    name: 'Gyanendra Singh',
    email: 'gyanendra@kiet.edu',
    branch: 'CSE',
    section: 'A',
    college: 'KIET Group of Institutions',
    handles: { codeforces: 'Um_nik', github: 'sindresorhus' },
  },
];

await connectDb();
await User.deleteMany({});

let roll = 1;
for (const entry of ROSTER) {
  const user = await User.create({
    ...entry,
    passwordHash: await bcrypt.hash('password123', 10),
    rollNo: `ROLL-${String(roll++).padStart(4, '0')}`,
  });
  process.stdout.write(`fetching live stats for ${user.name}... `);
  await refreshStudent(user);
  console.log(`composite ${user.composite}`);
  if (Object.keys(user.platformData.fetchErrors || {}).length) {
    console.log('  partial:', user.platformData.errors);
  }
}

console.log('\nSeeded. Sign in with krishna@kiet.edu / password123 for the admin account.');
await mongoose.disconnect();
