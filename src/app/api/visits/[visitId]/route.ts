import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Visit from '@/models/Visit';
import { Types } from 'mongoose';

interface Params {
  params: { visitId: string };
}

// GET: Fetch a single visit by ID
export async function GET(req: NextRequest, { params }: Params) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { visitId } = params;

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!visitId || !Types.ObjectId.isValid(visitId)) {
    return NextResponse.json({ message: 'Invalid Visit ID' }, { status: 400 });
  }

  try {
    const visit = await Visit.findOne({
      _id: new Types.ObjectId(visitId),
      doctor: new Types.ObjectId(doctorId), // Ensure visit belongs to the requesting doctor
    }).populate('patient', 'firstName lastName'); // Optionally populate patient info

    if (!visit) {
      return NextResponse.json({ message: 'Visit not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ visit }, { status: 200 });
  } catch (error) {
    console.error('Error fetching visit:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update a visit by ID
export async function PUT(req: NextRequest, { params }: Params) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { visitId } = params;

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!visitId || !Types.ObjectId.isValid(visitId)) {
    return NextResponse.json({ message: 'Invalid Visit ID' }, { status: 400 });
  }

  try {
    const updateData = await req.json();
    // Ensure the doctor and patient fields aren't accidentally changed via direct update
    delete updateData.doctor;
    delete updateData.patient;

    const updatedVisit = await Visit.findOneAndUpdate(
      {
        _id: new Types.ObjectId(visitId),
        doctor: new Types.ObjectId(doctorId), // Ensure doctor owns this visit
      },
      updateData,
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    if (!updatedVisit) {
      return NextResponse.json({ message: 'Visit not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Visit updated successfully', visit: updatedVisit }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating visit:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a visit by ID
export async function DELETE(req: NextRequest, { params }: Params) {
  await dbConnect();
  const doctorId = req.headers.get('X-Doctor-ID');
  const { visitId } = params;

  if (!doctorId || !Types.ObjectId.isValid(doctorId)) {
    return NextResponse.json({ message: 'Unauthorized or Invalid Doctor ID' }, { status: 401 });
  }
  if (!visitId || !Types.ObjectId.isValid(visitId)) {
    return NextResponse.json({ message: 'Invalid Visit ID' }, { status: 400 });
  }

  try {
    const deletedVisit = await Visit.findOneAndDelete({
        _id: new Types.ObjectId(visitId),
        doctor: new Types.ObjectId(doctorId), // Ensure doctor owns this visit
    });

    if (!deletedVisit) {
        return NextResponse.json({ message: 'Visit not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Visit deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting visit:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 