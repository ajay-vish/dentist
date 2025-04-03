import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor'; // Import Doctor model if needed for validation, though ID comes from middleware
import { Types } from 'mongoose';

// GET: Fetch all patients for the logged-in doctor
export async function GET(req: NextRequest) {
  await dbConnect();

  // Doctor ID should be attached by the middleware
  const doctorId = req.headers.get('X-Doctor-ID');

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }

  try {
    const patients = await Patient.find({ doctor: new Types.ObjectId(doctorId) }).sort({ lastName: 1, firstName: 1 });
    return NextResponse.json({ patients }, { status: 200 });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new patient for the logged-in doctor
export async function POST(req: NextRequest) {
  await dbConnect();

  const doctorId = req.headers.get('X-Doctor-ID');

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }

  try {
    const patientData = await req.json();

    // Add the doctor ID to the patient data before saving
    const newPatient = new Patient({
      ...patientData,
      doctor: new Types.ObjectId(doctorId),
    });

    await newPatient.save();

    return NextResponse.json(
      { message: 'Patient created successfully', patient: newPatient },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating patient:', error);
    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    // Handle duplicate key error (based on index in Patient model)
    if (error.code === 11000) {
        // Extract duplicate field from error message if possible, otherwise generic message
        return NextResponse.json({ message: 'Patient with this contact number or email already exists for this doctor.' }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 