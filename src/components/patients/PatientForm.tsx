'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IPatient } from '@/models/Patient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Add textarea: npx shadcn@latest add textarea
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils"; // From shadcn setup

// Define the validation schema using Zod
// Making email optional for the form, required status handled by DB schema
const patientFormSchema = z.object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().min(1, { message: "Last name is required." }),
    dateOfBirth: z.date({ required_error: "Date of birth is required." }),
    gender: z.enum(['Male', 'Female', 'Other'], { required_error: "Gender is required." }),
    contactNumber: z.string().min(10, { message: "Contact number seems too short." }), // Basic check
    email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    address: z.string().min(5, { message: "Address is required." }),
    medicalHistory: z.string().optional(),
});

// Define the type for the form values
export type PatientFormData = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
    initialData?: IPatient | null; // Make initialData optional
    onSubmit: (data: PatientFormData) => Promise<void>;
    isSubmitting: boolean;
    submitButtonText?: string;
    formTitle?: string;
}

export default function PatientForm({ 
    initialData,
    onSubmit,
    isSubmitting,
    submitButtonText = 'Save Patient',
    formTitle = 'Patient Information'
}: PatientFormProps) {
    
    // Convert date string from initialData to Date object
    const defaultValues = initialData ? {
        ...initialData,
        dateOfBirth: initialData.dateOfBirth ? parseISO(initialData.dateOfBirth as unknown as string) : undefined,
        email: initialData.email ?? '', // Ensure email is defined, default to empty string
        medicalHistory: initialData.medicalHistory ?? '',
    } : {
        firstName: '',
        lastName: '',
        dateOfBirth: undefined,
        gender: undefined,
        contactNumber: '',
        email: '',
        address: '',
        medicalHistory: '',
    };

    const form = useForm<PatientFormData>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: defaultValues,
    });

    // Reset form if initialData changes (e.g., navigating between edit pages)
    useEffect(() => {
         const resetValues = initialData ? {
            ...initialData,
            dateOfBirth: initialData.dateOfBirth ? parseISO(initialData.dateOfBirth as unknown as string) : undefined,
            email: initialData.email ?? '',
            medicalHistory: initialData.medicalHistory ?? '',
        } : {
            firstName: '',
            lastName: '',
            dateOfBirth: undefined,
            gender: undefined,
            contactNumber: '',
            email: '',
            address: '',
            medicalHistory: '',
        };
        form.reset(resetValues);
    }, [initialData, form.reset]);

    const handleSubmit = async (data: PatientFormData) => {
        await onSubmit(data);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{formTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} disabled={isSubmitting} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} disabled={isSubmitting} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date of birth</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                            )}
                                            disabled={isSubmitting}
                                        >
                                            {field.value ? (
                                            format(field.value, "PPP")
                                            ) : (
                                            <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Gender</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="contactNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(555) 123-4567" {...field} disabled={isSubmitting} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john.doe@email.com" {...field} type="email" disabled={isSubmitting}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="123 Main St, Anytown, USA" {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="medicalHistory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brief Medical History (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., Allergies, previous conditions..." {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : submitButtonText}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
} 