import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Doctor from '@/models/Doctor';
import { comparePassword, generateToken } from '@/lib/authUtils';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Find doctor by email, explicitly selecting the passwordHash
    const doctor = await Doctor.findOne({ email }).select('+passwordHash');

    if (!doctor) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 }); // Unauthorized
    }

    // Compare password
    const isMatch = await comparePassword(password, doctor.passwordHash);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 }); // Unauthorized
    }

    // Generate JWT
    const payload = {
      id: doctor._id,
      email: doctor.email,
      name: doctor.name,
      // Add other relevant doctor info to payload if needed, but keep it small
    };
    const token = generateToken(payload);

    // Prepare response object without password hash
    const doctorResponse = doctor.toObject();
    delete doctorResponse.passwordHash;

    // Send token and doctor info (excluding password hash)
    // Consider sending the token in an HttpOnly cookie for better security
    return NextResponse.json(
      { message: 'Login successful', token, doctor: doctorResponse },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 