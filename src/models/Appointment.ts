import mongoose, { Schema, Document, Types } from 'mongoose';
import { IPatient } from './Patient'; // Import Patient interface

export interface IAppointment extends Document {
  patient: Types.ObjectId | IPatient; // Can be ObjectId or populated IPatient
  doctor: Types.ObjectId; // Reference to the Doctor
  startTime: Date;
  endTime: Date;
  reason: string; // Reason for the appointment
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  notes?: string; // Optional notes about the appointment
}

const AppointmentSchema: Schema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
    index: true, // Index for querying appointments by time
  },
  endTime: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for the appointment.'],
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled',
    required: true,
    index: true,
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

// Index to efficiently query appointments by doctor and time range
AppointmentSchema.index({ doctor: 1, startTime: 1, endTime: 1 });
// Index to efficiently query appointments by patient and time range
AppointmentSchema.index({ patient: 1, startTime: 1 });

// TODO: Add validation to ensure endTime is after startTime
// TODO: Add validation/logic to prevent overlapping appointments for the same doctor

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema); 