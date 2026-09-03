import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../../shared/models';
import { env } from '../config/env';
import { ApiError } from '../middleware/error';

const SALT_ROUNDS = 12;
const TOKEN_TTL = '7d';

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET || 'dev-only-insecure-secret', { expiresIn: TOKEN_TTL });
}

export async function registerUser(name: string, email: string, password: string) {
  if (!name || !email || !password) throw new ApiError(400, 'name, email and password are required');
  if (password.length < 8) throw new ApiError(400, 'password must be at least 8 characters');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, isActive: true });

  return { token: signToken(String(user._id)), user: { id: user._id, name: user.name, email: user.email } };
}

export async function loginUser(email: string, password: string) {
  if (!email || !password) throw new ApiError(400, 'email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  return { token: signToken(String(user._id)), user: { id: user._id, name: user.name, email: user.email } };
}
