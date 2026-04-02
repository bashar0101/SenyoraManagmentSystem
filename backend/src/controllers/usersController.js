import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const DEFAULT_MANAGER_EMAIL = 'basharhas1999@gmail.com';

export const getAllUsers = async (req, res) => {
  const users = await User.find({}, '-passwordHash').sort({ createdAt: 1 });
  return res.status(200).json({ users });
};

export const createUser = async (req, res) => {
  const { name, lastName, email, password, role, hourlyRate } = req.body;

  if (!name || !lastName || !email || !password || !role) {
    return res.status(400).json({ message: 'name, lastName, email, password, and role are required' });
  }

  if (!['manager', 'employee'].includes(role)) {
    return res.status(400).json({ message: 'role must be manager or employee' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ message: 'A user with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    hourlyRate: hourlyRate || 0
  });

  return res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      hourlyRate: user.hourlyRate
    }
  });
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, lastName, email, password, role, hourlyRate } = req.body;

  const target = await User.findById(id);
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Default manager: block role changes, allow other field edits
  if (target.email === DEFAULT_MANAGER_EMAIL && role && role !== 'manager') {
    return res.status(403).json({ message: 'The default manager role cannot be changed' });
  }

  if (role && !['manager', 'employee'].includes(role)) {
    return res.status(400).json({ message: 'role must be manager or employee' });
  }

  // Check email uniqueness if changing email
  if (email && email.toLowerCase().trim() !== target.email) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }
  }

  const updates = {};
  if (name) updates.name = name.trim();
  if (lastName) updates.lastName = lastName.trim();
  if (email) updates.email = email.toLowerCase().trim();
  if (role && target.email !== DEFAULT_MANAGER_EMAIL) updates.role = role;
  if (hourlyRate !== undefined) updates.hourlyRate = Number(hourlyRate) || 0;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  const updated = await User.findByIdAndUpdate(id, updates, { new: true, select: '-passwordHash' });

  return res.status(200).json({ user: updated });
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  const target = await User.findById(id);
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (target.email === DEFAULT_MANAGER_EMAIL) {
    return res.status(403).json({ message: 'The default manager cannot be deleted' });
  }

  await User.findByIdAndDelete(id);
  return res.status(200).json({ message: 'User deleted successfully' });
};
