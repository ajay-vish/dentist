import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVisit extends Document {
  patient: Types.ObjectId; // Reference to the Patient
  doctor: Types.ObjectId; // Reference to the Doctor conducting the visit
  visitDate: Date;
  reason: string; // Reason for the visit
  diagnosis?: string; // Doctor's diagnosis
  treatmentNotes?: string; // Details about the treatment provided
  prescribedMedications?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  nextAppointment?: Date; // Optional date for the next follow-up
}

const VisitSchema: Schema = new Schema({
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
  visitDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  reason: {
    type: String,
    required: [true, 'Please provide the reason for the visit.'],
  },
  diagnosis: {
    type: String,
  },
  treatmentNotes: {
    type: String,
  },
  prescribedMedications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
  }],
  nextAppointment: {
    type: Date,
  },
}, { timestamps: true });

// Index for efficient querying of visits by patient or doctor
VisitSchema.index({ patient: 1, visitDate: -1 }); // Get patient visits sorted by date
VisitSchema.index({ doctor: 1, visitDate: -1 }); // Get doctor visits sorted by date

export default mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema); 