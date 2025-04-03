'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { useApiClient } from '@/hooks/useApiClient';
import { IPatient } from '@/models/Patient'; // Assuming interface is defined
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns'; // For formatting dates

export default function PatientsPage() {
    const { get, del } = useApiClient();
    const [patients, setPatients] = useState<IPatient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [patientToDelete, setPatientToDelete] = useState<IPatient | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const { data, error: fetchError } = await get<{ patients: IPatient[] }>('/patients');
        if (fetchError) {
            setError(fetchError);
            toast.error(`Failed to fetch patients: ${fetchError}`);
        } else if (data) {
            setPatients(data.patients);
        }
        setIsLoading(false);
    }, [get]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handleDelete = async () => {
        if (!patientToDelete) return;

        setIsDeleting(true);
        const { error: deleteError } = await del(`/patients/${patientToDelete._id}`);
        setIsDeleting(false);

        if (deleteError) {
            toast.error(`Failed to delete patient: ${deleteError}`);
        } else {
            toast.success(`Patient ${patientToDelete.firstName} ${patientToDelete.lastName} deleted successfully.`);
            setPatientToDelete(null); // Close dialog
            fetchPatients(); // Refresh the list
        }
    };

    return (
        <ProtectedLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Manage Patients</h1>
                <Link href="/patients/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Patient
                    </Button>
                </Link>
            </div>

            {isLoading && <p>Loading patients...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}

            {!isLoading && !error && (
                <div className="rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Date of Birth</TableHead>
                                <TableHead>Contact Number</TableHead>
                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No patients found.</TableCell>
                                </TableRow>
                            ) : (
                                patients.map((patient) => (
                                    <TableRow key={patient._id as string}>
                                        <TableCell className="font-medium">{patient.lastName}, {patient.firstName}</TableCell>
                                        <TableCell>{format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')}</TableCell>
                                        <TableCell>{patient.contactNumber}</TableCell>
                                        <TableCell className="hidden md:table-cell">{patient.email || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog open={!!patientToDelete && patientToDelete._id === patient._id} onOpenChange={(isOpen) => !isOpen && setPatientToDelete(null)}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/patients/${patient._id}`}><Eye className="mr-2 h-4 w-4" /> View Details</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                             <Link href={`/patients/${patient._id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => setPatientToDelete(patient)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {/* Delete Confirmation Dialog */} 
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Are you sure?</DialogTitle>
                                                        <DialogDescription>
                                                            This action cannot be undone. This will permanently delete the patient 
                                                            <span className="font-semibold"> {patientToDelete?.firstName} {patientToDelete?.lastName}</span> 
                                                            and all associated records (visits, appointments - if implemented).
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter>
                                                         <DialogClose asChild>
                                                            <Button variant="outline" onClick={() => setPatientToDelete(null)}>Cancel</Button>
                                                         </DialogClose>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={handleDelete}
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting ? 'Deleting...' : 'Delete Patient'}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </ProtectedLayout>
    );
} 