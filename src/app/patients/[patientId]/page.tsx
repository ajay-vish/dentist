'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { useApiClient } from '@/hooks/useApiClient';
import { IPatient } from '@/models/Patient';
import { IVisit } from '@/models/Visit'; // Import Visit interface
import { IAppointment } from '@/models/Appointment'; // Import Appointment interface
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, PlusCircle } from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';

export default function PatientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;
    const { get } = useApiClient();

    const [patient, setPatient] = useState<IPatient | null>(null);
    const [visits, setVisits] = useState<IVisit[]>([]);
    const [appointments, setAppointments] = useState<IAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all data for the patient
    const fetchData = useCallback(async () => {
        if (!patientId) return;
        setIsLoading(true);
        setError(null);

        try {
            // Fetch patient details, visits, and upcoming appointments in parallel
            const [patientRes, visitsRes, appointmentsRes] = await Promise.all([
                get<{ patient: IPatient }>(`/patients/${patientId}`),
                get<{ visits: IVisit[] }>(`/visits?patientId=${patientId}`),
                get<{ appointments: IAppointment[] }>(`/appointments?patientId=${patientId}&startDate=${format(new Date(), 'yyyy-MM-dd')}`) // Fetch upcoming from today
            ]);

            // Check for errors in each response
            if (patientRes.error) throw new Error(patientRes.error);
            if (visitsRes.error) throw new Error(visitsRes.error);
            if (appointmentsRes.error) throw new Error(appointmentsRes.error);

            if (patientRes.data) setPatient(patientRes.data.patient);
            if (visitsRes.data) setVisits(visitsRes.data.visits);
            if (appointmentsRes.data) setAppointments(appointmentsRes.data.appointments);

        } catch (err: any) {
             const errorMessage = err.message || 'Failed to load patient details';
             setError(errorMessage);
             toast.error(errorMessage);
             // Redirect if patient not found
             if (errorMessage.includes('not found') || errorMessage.includes('denied')) {
                 router.push('/patients');
             }
        } finally {
            setIsLoading(false);
        }
    }, [patientId, get, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <ProtectedLayout><p>Loading patient details...</p></ProtectedLayout>;
    }

    if (error || !patient) {
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
                <p className="text-red-500">Error loading patient: {error || 'Patient not found'}</p>
            </ProtectedLayout>
        );
    }

    return (
        <ProtectedLayout>
            <div className="mb-4 flex justify-between items-center">
                <Link href="/patients">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Patients
                    </Button>
                </Link>
                 <Link href={`/patients/${patientId}/edit`}>
                    <Button variant="secondary" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Patient
                    </Button>
                </Link>
            </div>

            {/* Patient Information Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-xl">{patient.firstName} {patient.lastName}</CardTitle>
                    <CardDescription>Patient Details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm md:grid-cols-3">
                        <div><strong>Date of Birth:</strong> {format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')}</div>
                        <div><strong>Gender:</strong> {patient.gender}</div>
                        <div><strong>Contact:</strong> {patient.contactNumber}</div>
                        <div><strong>Email:</strong> {patient.email || 'N/A'}</div>
                        <div className="md:col-span-2"><strong>Address:</strong> {patient.address}</div>
                    </div>
                     {patient.medicalHistory && (
                        <div>
                            <strong className="text-sm">Medical History:</strong> 
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{patient.medicalHistory}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* TODO: Add Visit and Appointment functionality later */} 
            <div className="grid gap-6 md:grid-cols-2">
                {/* Visit History Card */}
                 <Card>
                     <CardHeader className="flex flex-row items-center justify-between">
                         <CardTitle>Visit History</CardTitle>
                         {/* <Link href={`/visits/new?patientId=${patientId}`}> */} 
                         <Button variant="outline" size="sm" disabled> {/* Disabled for now */} 
                             <PlusCircle className="mr-2 h-4 w-4" />
                             Add Visit
                         </Button>
                         {/* </Link> */} 
                     </CardHeader>
                     <CardContent>
                        {/* Placeholder: List visits here */} 
                         {visits.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visits.slice(0, 5).map(visit => ( // Show recent 5
                                        <TableRow key={visit._id as string}>
                                            <TableCell>{format(new Date(visit.visitDate), 'MM/dd/yyyy')}</TableCell>
                                            <TableCell>{visit.reason}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" disabled>View</Button> {/* Disabled */} 
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         ) : (
                            <p className="text-sm text-muted-foreground">No visit history found.</p>
                         )}
                         {visits.length > 5 && <Link href={`#`}><Button variant="link" size="sm" className="mt-2">View All Visits</Button></Link>}
                     </CardContent>
                 </Card>

                {/* Upcoming Appointments Card */}
                 <Card>
                     <CardHeader className="flex flex-row items-center justify-between">
                         <CardTitle>Upcoming Appointments</CardTitle>
                          {/* <Link href={`/appointments/new?patientId=${patientId}`}> */} 
                         <Button variant="outline" size="sm" disabled> {/* Disabled */} 
                             <PlusCircle className="mr-2 h-4 w-4" />
                             New Appointment
                         </Button>
                         {/* </Link> */} 
                     </CardHeader>
                     <CardContent>
                         {/* Placeholder: List upcoming appointments */} 
                         {appointments.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointments.map(appt => (
                                        <TableRow key={appt._id as string}>
                                            <TableCell>{format(new Date(appt.startTime), 'MM/dd/yyyy hh:mm a')}</TableCell>
                                            <TableCell>{appt.reason}</TableCell>
                                            <TableCell>{appt.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         ) : (
                            <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
                         )}
                         {/* Link to full appointment calendar? */} 
                     </CardContent>
                 </Card>
             </div>

        </ProtectedLayout>
    );
} 