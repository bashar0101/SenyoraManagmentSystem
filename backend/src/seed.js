/**
 * Database seed script — run once to create initial users.
 * Usage: node src/seed.js
 *
 * Creates:
 *   - 1 manager: manager@company.com / password123
 *   - 2 employees: alice@company.com / password123, bob@company.com / password123
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senyora');
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  console.log('Cleared existing users');

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await User.insertMany([
    {
      name: 'Sarah Manager',
      email: 'manager@company.com',
      passwordHash,
      role: 'manager',
      hourlyRate: 0
    },
    {
      name: 'Alice Employee',
      email: 'alice@company.com',
      passwordHash,
      role: 'employee',
      hourlyRate: 25
    },
    {
      name: 'Bob Employee',
      email: 'bob@company.com',
      passwordHash,
      role: 'employee',
      hourlyRate: 20
    }
  ]);

  console.log('Seeded users:');
  users.forEach((u) => console.log(`  ${u.role}: ${u.email}`));

  await mongoose.disconnect();
  console.log('Done. You can now log in with password: password123');
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
