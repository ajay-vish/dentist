import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/models/Appointment';
import { Types } from 'mongoose';

interface Params {
  params: { appointmentId: string };
}

// GET: Fetch a single appointment by ID
export async function GET(req: NextRequest, { params }: Params) {
    await dbConnect();
    const doctorId = req.headers.get('X-Doctor-ID');
    const { appointmentId } = params;
  
    if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
    }
    if (!appointmentId || !Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json({ message: 'Invalid Appointment ID' }, { status: 400 });
    }
  
    try {
      const appointment = await Appointment.findOne({
        _id: new Types.ObjectId(appointmentId),
        doctor: new Types.ObjectId(doctorId), // Ensure appointment belongs to the requesting doctor
      }).populate('patient', 'firstName lastName contactNumber'); // Populate patient info
  
      if (!appointment) {
        return NextResponse.json({ message: 'Appointment not found or access denied' }, { status: 404 });
      }
  
      return NextResponse.json({ appointment }, { status: 200 });
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  }

// PUT: Update an appointment by ID (e.g., reschedule, change status)
export async function PUT(req: NextRequest, { params }: Params) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { appointmentId } = params;

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!appointmentId || !Types.ObjectId.isValid(appointmentId)) {
    return NextResponse.json({ message: 'Invalid Appointment ID' }, { status: 400 });
  }

  try {
    const updateData = await req.json();

    // Prevent changing the doctor or patient directly
    delete updateData.doctor;
    delete updateData.patient;

    // Convert date strings to Date objects if present
    if (updateData.startTime) {
        updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.endTime) {
        updateData.endTime = new Date(updateData.endTime);
    }

    // TODO: Add validation for overlapping appointments if time is changed

    const updatedAppointment = await Appointment.findOneAndUpdate(
      {
        _id: new Types.ObjectId(appointmentId),
        doctor: new Types.ObjectId(doctorId), // Ensure doctor owns this appointment
      },
      updateData,
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    if (!updatedAppointment) {
      return NextResponse.json({ message: 'Appointment not found or access denied' }, { status: 404 });
    }

    // Populate patient details for the response
    await updatedAppointment.populate('patient', 'firstName lastName contactNumber');

    return NextResponse.json({ message: 'Appointment updated successfully', appointment: updatedAppointment }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating appointment:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete/Cancel an appointment by ID
export async function DELETE(req: NextRequest, { params }: Params) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { appointmentId } = params;

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!appointmentId || !Types.ObjectId.isValid(appointmentId)) {
    return NextResponse.json({ message: 'Invalid Appointment ID' }, { status: 400 });
  }

  try {
    const deletedAppointment = await Appointment.findOneAndDelete({
        _id: new Types.ObjectId(appointmentId),
        doctor: new Types.ObjectId(doctorId), // Ensure doctor owns this appointment
    });

    if (!deletedAppointment) {
        return NextResponse.json({ message: 'Appointment not found or access denied' }, { status: 404 });
    }

    // Instead of deleting, you might want to update the status to 'Cancelled'
    // const updatedAppointment = await Appointment.findOneAndUpdate(
    //   { _id: new Types.ObjectId(appointmentId), doctor: new Types.ObjectId(doctorId) },
    //   { status: 'Cancelled' },
    //   { new: true }
    // );
    // if (!updatedAppointment) return NextResponse.json({ message: 'Appointment not found or access denied' }, { status: 404 });
    // return NextResponse.json({ message: 'Appointment cancelled successfully' }, { status: 200 });

    return NextResponse.json({ message: 'Appointment deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 