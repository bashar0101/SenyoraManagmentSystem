import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const initDefaultManager = async () => {
  const existing = await User.findOne({ email: 'basharhas1999@gmail.com' });
  if (!existing) {
    const passwordHash = await bcrypt.hash('111222', 10);
    await User.create({
      name: 'Bashar',
      lastName: 'Khoujah',
      email: 'basharhas1999@gmail.com',
      passwordHash,
      role: 'manager',
      hourlyRate: 0
    });
    console.log('Default manager created: basharhas1999@gmail.com');
  }
};
