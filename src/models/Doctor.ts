import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  passwordHash: string;
  specialty: string;
  // Add any other doctor-specific fields here
}

const DoctorSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the doctor.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'], // Basic email validation
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required.'],
    select: false, // Don't return password hash by default
  },
  specialty: {
    type: String,
    required: [true, 'Please provide a specialty.'],
  },
  // Timestamps add createdAt and updatedAt fields
}, { timestamps: true });

export default mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema); 