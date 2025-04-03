import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Visit from '@/models/Visit';
import Patient from '@/models/Patient'; // To verify patient belongs to the doctor
import { Types } from 'mongoose';

// GET: Fetch visits for a specific patient (belonging to the logged-in doctor)
export async function GET(req: NextRequest) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!patientId || !Types.ObjectId.isValid(patientId)) {
    return NextResponse.json({ message: 'Valid Patient ID is required as a query parameter' }, { status: 400 });
  }

  try {
    const patientObjectId = new Types.ObjectId(patientId);
    const doctorObjectId = new Types.ObjectId(doctorId);

    // First, verify the patient belongs to the doctor making the request
    const patient = await Patient.findOne({
      _id: patientObjectId,
      doctor: doctorObjectId,
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found or access denied for this doctor' }, { status: 404 });
    }

    // Fetch visits for this patient, ordered by date descending
    const visits = await Visit.find({
      patient: patientObjectId,
      doctor: doctorObjectId, // Ensure visit was recorded by the same doctor (or modify if other docs can view)
    }).sort({ visitDate: -1 });

    return NextResponse.json({ visits }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new visit record for a patient
export async function POST(req: NextRequest) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }

  try {
    const visitData = await req.json();
    const { patient: patientId, ...restOfData } = visitData;

    if (!patientId || !Types.ObjectId.isValid(patientId)) {
        return NextResponse.json({ message: 'Valid Patient ID is required in the request body' }, { status: 400 });
    }

    const patientObjectId = new Types.ObjectId(patientId);
    const doctorObjectId = new Types.ObjectId(doctorId);

    // Verify the patient exists and belongs to this doctor before adding a visit
    const patient = await Patient.findOne({
        _id: patientObjectId,
        doctor: doctorObjectId,
      });
  
      if (!patient) {
        return NextResponse.json({ message: 'Patient not found or access denied for this doctor' }, { status: 404 });
      }

    // Create the new visit, associating it with the patient and the logged-in doctor
    const newVisit = new Visit({
      ...restOfData,
      patient: patientObjectId,
      doctor: doctorObjectId, // Set the doctor ID from the authenticated user
    });

    await newVisit.save();

    return NextResponse.json(
      { message: 'Visit created successfully', visit: newVisit },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating visit:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 