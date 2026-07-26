const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');

const register = async ({ fullName, username, email, password }) => {
  const normalizedUsername = username.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (existing) {
    const field = existing.username === normalizedUsername ? 'username' : 'email';
    throw ApiError.conflict(`That ${field} is already taken`);
  }

  const user = await User.create({
    fullName,
    username: normalizedUsername,
    email: normalizedEmail,
    password,
  });

  const token = signToken({ id: user._id });
  return { user: user.toOwnProfileJSON(), token };
};

const login = async ({ identifier, password }) => {
  if (!identifier || !password) {
    throw ApiError.badRequest('Identifier and password are required', [
      'identifier',
      'password',
    ]);
  }

  const normalized = identifier.toLowerCase().trim();
  const user = await User.findOne({
    $or: [{ username: normalized }, { email: normalized }],
  }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid credentials', 'UNAUTHENTICATED');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials', 'UNAUTHENTICATED');
  }

  const token = signToken({ id: user._id });
  return { user: user.toOwnProfileJSON(), token };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toOwnProfileJSON();
};

module.exports = { register, login, getMe };
