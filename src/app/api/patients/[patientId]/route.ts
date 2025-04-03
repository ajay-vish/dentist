import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit'; // Needed for cascade delete
import Appointment from '@/models/Appointment'; // Needed for cascade delete
import { Types } from 'mongoose';

interface Params {
  params: { patientId: string };
}

// GET: Fetch a single patient by ID
export async function GET(req: NextRequest, { params }: Params) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { patientId } = params;

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!patientId || !Types.ObjectId.isValid(patientId)) {
    return NextResponse.json({ message: 'Invalid Patient ID' }, { status: 400 });
  }

  try {
    const patient = await Patient.findOne({
      _id: new Types.ObjectId(patientId),
      doctor: new Types.ObjectId(doctorId), // Ensure patient belongs to the requesting doctor
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ patient }, { status: 200 });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update a patient by ID
export async function PUT(req: NextRequest, { params }: Params) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { patientId } = params;

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!patientId || !Types.ObjectId.isValid(patientId)) {
    return NextResponse.json({ message: 'Invalid Patient ID' }, { status: 400 });
  }

  try {
    const updateData = await req.json();
    // Ensure the doctor field isn't accidentally changed
    delete updateData.doctor;

    const updatedPatient = await Patient.findOneAndUpdate(
      {
        _id: new Types.ObjectId(patientId),
        doctor: new Types.ObjectId(doctorId), // Ensure doctor owns this patient
      },
      updateData,
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    if (!updatedPatient) {
      return NextResponse.json({ message: 'Patient not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Patient updated successfully', patient: updatedPatient }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating patient:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000) {
        return NextResponse.json({ message: 'Update failed: Duplicate contact number or email for this doctor.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a patient by ID
export async function DELETE(req: NextRequest, { params }: Params) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { patientId } = params;

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!patientId || !Types.ObjectId.isValid(patientId)) {
    return NextResponse.json({ message: 'Invalid Patient ID' }, { status: 400 });
  }

  try {
    const patientObjectId = new Types.ObjectId(patientId);
    const doctorObjectId = new Types.ObjectId(doctorId);

    // Find the patient first to ensure it exists and belongs to the doctor
    const patient = await Patient.findOne({
        _id: patientObjectId,
        doctor: doctorObjectId,
    });

    if (!patient) {
        return NextResponse.json({ message: 'Patient not found or access denied' }, { status: 404 });
    }

    // Perform the delete operation
    await Patient.deleteOne({ _id: patientObjectId });

    // Optional: Cascade delete related records (Visits, Appointments)
    // Consider the implications: do you want to permanently lose all history?
    // Alternatively, mark the patient as inactive instead of deleting.
    // await Visit.deleteMany({ patient: patientObjectId });
    // await Appointment.deleteMany({ patient: patientObjectId });

    return NextResponse.json({ message: 'Patient deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 