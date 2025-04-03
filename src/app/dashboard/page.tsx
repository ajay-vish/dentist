'use client';

import React from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar"; // For displaying a mini calendar

export default function DashboardPage() {
    const { doctor } = useAuth();
    const [date, setDate] = React.useState<Date | undefined>(new Date());

    // TODO: Fetch upcoming appointments for the selected date or week

    return (
        <ProtectedLayout>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Welcome Back!</CardTitle>
                        {/* Optional: Icon like Activity */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Dr. {doctor?.name || 'User'}</div>
                        <p className="text-xs text-muted-foreground">
                            {doctor?.specialty || 'Dental Practice'}
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                         {/* Icon */}
                    </CardHeader>
                    <CardContent>
                        {/* TODO: Replace with actual appointment count */} 
                        <div className="text-2xl font-bold">5</div> 
                        <p className="text-xs text-muted-foreground">View schedule</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                         {/* Icon */}
                    </CardHeader>
                    <CardContent>
                         {/* TODO: Replace with actual patient count */} 
                        <div className="text-2xl font-bold">120</div>
                        <p className="text-xs text-muted-foreground">Manage patients</p>
                    </CardContent>
                </Card>
                 {/* Add more summary cards if needed */}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                 <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Upcoming Appointments</CardTitle>
                        <CardDescription>Appointments scheduled for the next 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                         {/* TODO: Display list/table of upcoming appointments */} 
                        <p className="text-sm text-muted-foreground">No upcoming appointments found.</p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Calendar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            // TODO: Add indicators for days with appointments
                        />
                    </CardContent>
                </Card>
            </div>
        </ProtectedLayout>
    );
} 