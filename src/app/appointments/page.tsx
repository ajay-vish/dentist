'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { useApiClient } from '@/hooks/useApiClient';
import { IAppointment } from '@/models/Appointment';
import { IPatient } from '@/models/Patient';
import { Calendar, dateFnsLocalizer, Views, EventProps, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import AppointmentForm, { AppointmentFormData } from '@/components/appointments/AppointmentForm';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Types } from 'mongoose';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
    getDay,
    locales,
});

interface CalendarEvent {
    _id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    patient?: IPatient;
    doctor: Types.ObjectId;
    reason: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
    notes?: string;
    originalAppointment: IAppointment;
}

export default function AppointmentsPage() {
    const { get, post, put, del } = useApiClient();
    const [appointments, setAppointments] = useState<IAppointment[]>([]);
    const [patients, setPatients] = useState<IPatient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<any>(Views.WEEK);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAppointments = useCallback(async (start: Date, end: Date) => {
        setIsLoading(true);
        const startDateStr = format(start, 'yyyy-MM-dd');
        const endDateStr = format(end, 'yyyy-MM-dd');
        const { data, error } = await get<{ appointments: IAppointment[] }>(
            `/appointments?startDate=${startDateStr}&endDate=${endDateStr}`
        );
        if (error) {
            toast.error(`Failed to fetch appointments: ${error}`);
        } else if (data) {
            setAppointments(data.appointments);
        }
        setIsLoading(false);
    }, [get]);

    const fetchPatients = useCallback(async () => {
        const { data, error } = await get<{ patients: IPatient[] }>('/patients');
        if (error) {
            toast.error(`Failed to fetch patients for form: ${error}`);
        } else if (data) {
            setPatients(data.patients);
        }
    }, [get]);

    useEffect(() => {
        const start = startOfWeek(currentDate, { locale: enUS });
        const end = addHours(start, 24 * 7);
        fetchAppointments(start, end);
        fetchPatients();
    }, [fetchAppointments, fetchPatients]);

    const formattedEvents: CalendarEvent[] = useMemo(() => {
        return appointments
            .filter(appt => appt.patient && typeof appt.patient === 'object' && 'firstName' in appt.patient)
            .map(appt => {
                const patient = appt.patient as IPatient;
                return {
                    _id: String(appt._id),
                    title: `${patient.firstName} ${patient.lastName} - ${appt.reason}`,
                    start: new Date(appt.startTime),
                    end: new Date(appt.endTime),
                    patient: patient,
                    doctor: appt.doctor,
                    reason: appt.reason,
                    status: appt.status,
                    notes: appt.notes,
                    originalAppointment: appt,
                };
            });
    }, [appointments]);

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        if (view === Views.WEEK || view === Views.DAY) {
            setSelectedSlot(slotInfo);
            setSelectedEvent(null);
            setIsModalOpen(true);
        }
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setSelectedSlot(null);
        setIsModalOpen(true);
    };

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
        const start = startOfWeek(newDate, { locale: enUS });
        const end = addHours(start, 24 * 7);
        fetchAppointments(start, end);
    };

    const handleViewChange = (newView: any) => {
        setView(newView);
        const start = startOfWeek(currentDate, { locale: enUS });
        const end = addHours(start, 24 * 7);
        fetchAppointments(start, end);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedSlot(null);
        setSelectedEvent(null);
    };

    const handleFormSubmit = async (formData: AppointmentFormData) => {
        setIsSubmitting(true);
        let result: { data?: any; error?: string | null } = {};

        const payload = {
            ...formData,
            patient: formData.patientId,
            startTime: formData.startTime.toISOString(),
            endTime: formData.endTime.toISOString(),
        };

        if (selectedEvent?._id) {
            result = await put(`/appointments/${selectedEvent._id}`, payload);
        } else {
            result = await post('/appointments', payload);
        }

        setIsSubmitting(false);

        if (result.error) {
            toast.error(`Failed to ${selectedEvent ? 'update' : 'create'} appointment: ${result.error}`);
        } else {
            toast.success(`Appointment ${selectedEvent ? 'updated' : 'created'} successfully!`);
            handleModalClose();
            const start = startOfWeek(currentDate, { locale: enUS });
            const end = addHours(start, 24 * 7);
            fetchAppointments(start, end);
        }
    };

    const handleDeleteAppointment = async () => {
        if (!selectedEvent?._id) return;

        setIsSubmitting(true);
        const { error } = await del(`/appointments/${selectedEvent._id}`);
        setIsSubmitting(false);

        if (error) {
            toast.error(`Failed to delete appointment: ${error}`);
        } else {
            toast.success('Appointment deleted successfully!');
            handleModalClose();
            const start = startOfWeek(currentDate, { locale: enUS });
            const end = addHours(start, 24 * 7);
            fetchAppointments(start, end);
        }
    };

    const EventComponent = ({ event }: EventProps<CalendarEvent>) => (
        <div>
            <strong>{event.patient?.firstName} {event.patient?.lastName}</strong>
            <div>{event.reason}</div>
            <div className="text-xs">{format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}</div>
        </div>
    );

    return (
        <ProtectedLayout>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Appointment Calendar</h1>
                <Button onClick={() => { setSelectedEvent(null); setSelectedSlot(null); setIsModalOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Appointment
                </Button>
            </div>

            {isLoading && <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading appointments...</div>}

            <div className="bg-white p-4 rounded-lg shadow h-[75vh]">
                <Calendar
                    localizer={localizer}
                    events={formattedEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    view={view}
                    date={currentDate}
                    onNavigate={handleNavigate}
                    onView={handleViewChange}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    selectable
                    components={{
                        event: EventComponent,
                    }}
                    min={new Date(0, 0, 0, 8, 0, 0)}
                    max={new Date(0, 0, 0, 17, 0, 0)}
                />
            </div>

            <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleModalClose()}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{selectedEvent ? 'Edit Appointment' : 'Create New Appointment'}</DialogTitle>
                        <DialogDescription>
                            {selectedEvent ? 'Update the details below.' : 'Fill in the details to schedule a new appointment.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <AppointmentForm 
                        patients={patients}
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        initialData={selectedEvent ? {
                            patientId: selectedEvent.patient?._id as string,
                            startTime: selectedEvent.start,
                            endTime: selectedEvent.end,
                            reason: selectedEvent.reason,
                            notes: selectedEvent.notes,
                            status: selectedEvent.status
                        } : (selectedSlot ? { 
                            startTime: selectedSlot.start, 
                            endTime: selectedSlot.end,
                            patientId: '',
                            reason: '',
                            notes: '',
                            status: 'Scheduled'
                        } : undefined) }
                        onDelete={selectedEvent ? handleDeleteAppointment : undefined}
                        isDeleting={isSubmitting}
                    /> 
                </DialogContent>
            </Dialog>
        </ProtectedLayout>
    );
} 