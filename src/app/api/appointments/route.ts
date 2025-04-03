import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/models/Appointment';
import Patient from '@/models/Patient'; // To verify patient belongs to the doctor
import { Types } from 'mongoose';

// GET: Fetch appointments for the logged-in doctor (optionally filtered)
export async function GET(req: NextRequest) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { searchParams } = new URL(req.url);

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }

  try {
    const doctorObjectId = new Types.ObjectId(doctorId);
    const patientId = searchParams.get('patientId');
    const startDate = searchParams.get('startDate'); // e.g., YYYY-MM-DD
    const endDate = searchParams.get('endDate');     // e.g., YYYY-MM-DD

    // Base query: appointments for the logged-in doctor
    const query: any = { doctor: doctorObjectId };

    // Add patient filter if provided and valid
    if (patientId && Types.ObjectId.isValid(patientId)) {
      query.patient = new Types.ObjectId(patientId);
    }

    // Add date range filter if both start and end dates are provided
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Start of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the day

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date format');
        }

        query.startTime = { $gte: start, $lte: end };
      } catch (dateError) {
        return NextResponse.json({ message: 'Invalid date format for startDate or endDate. Use YYYY-MM-DD.' }, { status: 400 });
      }
    } else if (startDate) {
        // If only startDate, get appointments for that specific day
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(startDate);
            end.setHours(23, 59, 59, 999);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date format');
            }
            query.startTime = { $gte: start, $lte: end };
        } catch (dateError) {
            return NextResponse.json({ message: 'Invalid date format for startDate. Use YYYY-MM-DD.' }, { status: 400 });
        }
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName contactNumber') // Populate patient details
      .sort({ startTime: 1 }); // Sort by start time ascending

    return NextResponse.json({ appointments }, { status: 200 });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new appointment
export async function POST(req: NextRequest) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }

  try {
    const appointmentData = await req.json();
    const { patient: patientId, startTime, endTime, ...restOfData } = appointmentData;

    if (!patientId || !Types.ObjectId.isValid(patientId)) {
      return NextResponse.json({ message: 'Valid Patient ID is required' }, { status: 400 });
    }
    if (!startTime || !endTime) {
        return NextResponse.json({ message: 'Start time and end time are required' }, { status: 400 });
    }

    const patientObjectId = new Types.ObjectId(patientId);
    const doctorObjectId = new Types.ObjectId(doctorId);

    // Verify the patient exists and belongs to this doctor
    const patient = await Patient.findOne({ _id: patientObjectId, doctor: doctorObjectId });
    if (!patient) {
      return NextResponse.json({ message: 'Patient not found or access denied for this doctor' }, { status: 404 });
    }

    // TODO: Add validation here to prevent overlapping appointments for the same doctor
    // This requires querying existing appointments for the doctor around the proposed startTime/endTime

    const newAppointment = new Appointment({
      ...restOfData,
      patient: patientObjectId,
      doctor: doctorObjectId,
      startTime: new Date(startTime), // Ensure dates are stored as Date objects
      endTime: new Date(endTime),
      status: 'Scheduled', // Default status
    });

    await newAppointment.save();

    // Populate patient details for the response
    await newAppointment.populate('patient', 'firstName lastName');

    return NextResponse.json(
      { message: 'Appointment created successfully', appointment: newAppointment },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating appointment:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    // Handle potential date parsing errors if necessary
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 