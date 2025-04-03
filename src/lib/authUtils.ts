import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

// Function to hash a password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

// Function to compare a plain password with a hashed password
export const comparePassword = async (
  plainPass: string,
  hashedPass: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPass, hashedPass);
};

// Function to generate a JWT token
export const generateToken = (payload: object, expiresIn: string | number = '1d'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Function to verify a JWT token
export const verifyToken = (token: string): string | object => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Handle specific errors like TokenExpiredError or JsonWebTokenError if needed
    console.error('JWT Verification Error:', error);
    throw new Error('Invalid or expired token.');
  }
}; 