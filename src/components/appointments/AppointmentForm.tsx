'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IPatient } from '@/models/Patient';
import { IAppointment } from '@/models/Appointment';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from 'lucide-react';
import { format, setHours, setMinutes, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { DialogFooter, DialogClose } from "@/components/ui/dialog"; // Import Dialog parts for buttons

// Define the validation schema using Zod
const appointmentFormSchema = z.object({
    patientId: z.string().min(1, { message: "Patient selection is required." }),
    startTime: z.date({ required_error: "Start date and time are required." }),
    endTime: z.date({ required_error: "End date and time are required." }),
    reason: z.string().min(3, { message: "Reason must be at least 3 characters." }),
    status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']).optional(), // Status might be set server-side or later
    notes: z.string().optional(),
}).refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"], // Path of error
});

// Define the type for the form values
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
    patients: IPatient[]; // List of patients for the dropdown
    initialData?: Partial<AppointmentFormData> & { startTime?: Date | string; endTime?: Date | string }; // Can be partial for create
    onSubmit: (data: AppointmentFormData) => Promise<void>;
    isSubmitting: boolean;
    submitButtonText?: string;
    onDelete?: () => Promise<void>; // Optional delete handler for edit mode
    isDeleting?: boolean; // Loading state for delete
}

// Helper to generate time slots (e.g., every 30 minutes)
const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number) => {
    const slots = [];
    let currentTime = setMinutes(setHours(new Date(), startHour), 0);
    const endTime = setMinutes(setHours(new Date(), endHour), 0);

    while (currentTime <= endTime) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = new Date(currentTime.getTime() + intervalMinutes * 60000);
    }
    return slots;
};

export default function AppointmentForm({ 
    patients,
    initialData,
    onSubmit,
    isSubmitting,
    submitButtonText = 'Save Appointment',
    onDelete,
    isDeleting = false
}: AppointmentFormProps) {
    
    const timeSlots = generateTimeSlots(8, 17, 30); // 8 AM to 5 PM, 30 min intervals

    // Convert date strings from initialData to Date objects
    const parseDate = (dateStrOrObj: Date | string | undefined): Date | undefined => {
        if (!dateStrOrObj) return undefined;
        if (dateStrOrObj instanceof Date) return dateStrOrObj;
        try {
            return parseISO(dateStrOrObj);
        } catch (e) {
            return undefined;
        }
    };

    const defaultValues = {
        patientId: initialData?.patientId ?? '',
        startTime: parseDate(initialData?.startTime),
        endTime: parseDate(initialData?.endTime),
        reason: initialData?.reason ?? '',
        status: initialData?.status ?? 'Scheduled',
        notes: initialData?.notes ?? '',
    };

    const form = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentFormSchema),
        defaultValues: defaultValues,
    });

    // Reset form if initialData changes
    useEffect(() => {
        form.reset({
            patientId: initialData?.patientId ?? '',
            startTime: parseDate(initialData?.startTime),
            endTime: parseDate(initialData?.endTime),
            reason: initialData?.reason ?? '',
            status: initialData?.status ?? 'Scheduled',
            notes: initialData?.notes ?? '',
        });
    }, [initialData, form.reset]);

    const handleSubmit = async (data: AppointmentFormData) => {
        await onSubmit(data);
    };

    // Function to handle date change and potentially time
    const handleDateTimeChange = (field: 'startTime' | 'endTime', date: Date | undefined, timeString?: string) => {
        if (!date) {
            form.setValue(field, undefined as any); // Clear if date is undefined
            return;
        }

        let newDate = new Date(date); // Start with the selected date

        if (timeString) {
            const [hours, minutes] = timeString.split(':').map(Number);
            newDate = setMinutes(setHours(newDate, hours), minutes);
        }
         // Preserve existing time if only date is changed
        else if (form.getValues(field)) {
             const currentTime = form.getValues(field);
             newDate = setMinutes(setHours(newDate, currentTime.getHours()), currentTime.getMinutes());
        }

        form.setValue(field, newDate, { shouldValidate: true });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Patient</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || !!initialData?.patientId}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a patient" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {patients.length > 0 ? (
                                        patients.map((p) => (
                                            <SelectItem key={p._id as string} value={p._id as string}>
                                                {p.lastName}, {p.firstName} ({p.contactNumber})
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Start Date/Time */} 
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Start Date & Time</FormLabel>
                            <div className="flex gap-2">
                                {/* Date Picker */} 
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn("flex-1 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                disabled={isSubmitting}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={(date) => handleDateTimeChange('startTime', date)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                 {/* Time Picker */} 
                                <Select 
                                    value={field.value ? format(field.value, 'HH:mm') : ''}
                                    onValueChange={(time) => handleDateTimeChange('startTime', field.value, time)} 
                                    disabled={isSubmitting || !field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-[120px]">
                                            <Clock className="h-4 w-4 mr-1" />
                                            <SelectValue placeholder="Time" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Select Time</SelectLabel>
                                            {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{format(parse(slot, 'HH:mm', new Date()), 'h:mm a')}</SelectItem>)}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     {/* End Date/Time */} 
                    <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>End Date & Time</FormLabel>
                             <div className="flex gap-2">
                                {/* Date Picker */} 
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn("flex-1 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                disabled={isSubmitting}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={(date) => handleDateTimeChange('endTime', date)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                 {/* Time Picker */} 
                                <Select 
                                    value={field.value ? format(field.value, 'HH:mm') : ''}
                                    onValueChange={(time) => handleDateTimeChange('endTime', field.value, time)} 
                                    disabled={isSubmitting || !field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-[120px]">
                                            <Clock className="h-4 w-4 mr-1" />
                                            <SelectValue placeholder="Time" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                         <SelectGroup>
                                             <SelectLabel>Select Time</SelectLabel>
                                            {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{format(parse(slot, 'HH:mm', new Date()), 'h:mm a')}</SelectItem>)}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                
                 <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Appointment</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Checkup, Cleaning, Filling" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Any specific notes for this appointment..." {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                 {/* Optionally allow changing status in edit mode */} 
                 {initialData?.status && (
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 )}

                 <DialogFooter className="pt-4">
                    {/* Add Delete button only if onDelete handler is provided (i.e., in edit mode) */} 
                    {onDelete && (
                        <Button
                            type="button" // Important: prevent form submission
                            variant="destructive"
                            onClick={onDelete}
                            disabled={isDeleting || isSubmitting}
                            className="mr-auto" // Push delete button to the left
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Appointment'}
                        </Button>
                    )}
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : submitButtonText}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
} 