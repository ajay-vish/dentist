'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import PatientForm, { PatientFormData } from '@/components/patients/PatientForm';
import { useApiClient } from '@/hooks/useApiClient';
import { IPatient } from '@/models/Patient';
import { toast } from "sonner";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditPatientPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;
    const { get, put } = useApiClient();
    const [patient, setPatient] = useState<IPatient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch patient data
    const fetchPatient = useCallback(async () => {
        if (!patientId) return;
        setIsLoading(true);
        setError(null);
        const { data, error: fetchError } = await get<{ patient: IPatient }>(`/patients/${patientId}`);
        if (fetchError) {
            setError(fetchError);
            toast.error(`Failed to load patient data: ${fetchError}`);
            // Optionally redirect if patient not found or access denied (404/403)
             if (fetchError.includes('not found') || fetchError.includes('denied')) {
                 router.push('/patients');
             }
        } else if (data) {
            setPatient(data.patient);
        }
        setIsLoading(false);
    }, [patientId, get, router]);

    useEffect(() => {
        fetchPatient();
    }, [fetchPatient]);

    // Handle form submission
    const handleEditPatient = async (data: PatientFormData) => {
        setIsSubmitting(true);
        const { error: updateError } = await put(`/patients/${patientId}`, data);

        if (updateError) {
            toast.error(`Failed to update patient: ${updateError}`);
            setIsSubmitting(false);
        } else {
            toast.success(`Patient ${data.firstName} ${data.lastName} updated successfully!`);
            // Redirect back to patient list or patient detail page
            router.push('/patients'); // Or `/patients/${patientId}`
             // No need to set isSubmitting to false if redirecting
        }
    };

    if (isLoading) {
        return <ProtectedLayout><p>Loading patient data...</p></ProtectedLayout>;
    }

    if (error && !patient) {
         return <ProtectedLayout><p className="text-red-500">Error loading patient: {error}</p></ProtectedLayout>;
    }

    return (
        <ProtectedLayout>
            <div className="mb-4">
                 {/* Link back to patient list or patient detail page */} 
                 <Link href={`/patients`}> 
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                         Back to Patients
                    </Button>
                </Link>
            </div>
            <PatientForm 
                initialData={patient} 
                onSubmit={handleEditPatient} 
                isSubmitting={isSubmitting} 
                submitButtonText="Update Patient"
                formTitle="Edit Patient Information"
            />
        </ProtectedLayout>
    );
} 