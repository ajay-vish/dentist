import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Doctor from '@/models/Doctor';
import { hashPassword } from '@/lib/authUtils';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { name, email, password, specialty } = await req.json();

    // Basic validation
    if (!name || !email || !password || !specialty) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 }); // 409 Conflict
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new doctor
    const newDoctor = new Doctor({
      name,
      email,
      passwordHash,
      specialty,
    });

    await newDoctor.save();

    // Don't send password hash back
    const doctorResponse = newDoctor.toObject();
    delete doctorResponse.passwordHash;

    return NextResponse.json(
      { message: 'Doctor registered successfully', doctor: doctorResponse },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Signup Error:', error);
    // Handle Mongoose validation errors specifically if needed
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 