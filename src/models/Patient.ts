import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPatient extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber: string;
  email?: string; // Optional email
  address: string;
  medicalHistory?: string; // Optional brief medical history
  doctor: Types.ObjectId; // Reference to the Doctor who manages this patient
}

const PatientSchema: Schema = new Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide a first name.'],
  },
  lastName: {
    type: String,
    required: [true, 'Please provide a last name.'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide a date of birth.'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Please specify the gender.'],
  },
  contactNumber: {
    type: String,
    required: [true, 'Please provide a contact number.'],
  },
  email: {
    type: String,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'], // Basic email validation
  },
  address: {
    type: String,
    required: [true, 'Please provide an address.'],
  },
  medicalHistory: {
    type: String,
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor', // Reference the Doctor model
    required: true,
    index: true, // Add index for faster queries by doctor
  },
}, { timestamps: true });

// Index to ensure a patient (identified by contact number or email if present) is unique per doctor
// This prevents accidentally adding the same patient twice for the same doctor
// Note: Consider if email should also be part of the unique constraint if it's commonly used for identification
PatientSchema.index({ doctor: 1, contactNumber: 1 }, { unique: true });
PatientSchema.index({ doctor: 1, email: 1 }, { unique: true, sparse: true }); // sparse allows multiple null emails

export default mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema); 