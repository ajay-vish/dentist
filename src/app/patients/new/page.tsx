'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import PatientForm, { PatientFormData } from '@/components/patients/PatientForm';
import { useApiClient } from '@/hooks/useApiClient';
import { toast } from "sonner";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AddPatientPage() {
    const router = useRouter();
    const { post } = useApiClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddPatient = async (data: PatientFormData) => {
        setIsSubmitting(true);
        const { data: responseData, error } = await post('/patients', data);

        if (error) {
            toast.error(`Failed to add patient: ${error}`);
            setIsSubmitting(false);
        } else {
            toast.success(`Patient ${data.firstName} ${data.lastName} added successfully!`);
            // Redirect to the patient list page or the newly created patient's detail page
            // router.push('/patients'); 
            // Or potentially: router.push(`/patients/${responseData.patient._id}`);
            router.push('/patients'); // Keep it simple for now
            // No need to set isSubmitting to false if redirecting
        }
    };

    return (
        <ProtectedLayout>
             <div className="mb-4">
                <Link href="/patients">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Patients
                    </Button>
                </Link>
            </div>
            <PatientForm 
                onSubmit={handleAddPatient} 
                isSubmitting={isSubmitting} 
                submitButtonText="Add Patient"
                formTitle="Add New Patient"
            />
        </ProtectedLayout>
    );
} 