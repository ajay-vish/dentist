'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming you add avatar later: npx shadcn@latest add avatar
import { Home, Users, Calendar, LogOut, Settings } from 'lucide-react'; // Icons

interface ProtectedLayoutProps {
    children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const { token, doctor, isLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect to login if not authenticated and not loading
        if (!isLoading && !token) {
            router.push('/login');
        }
    }, [token, isLoading, router]);

    // Show loading state or null while checking auth
    if (isLoading || !token) {
        // You might want a more sophisticated loading spinner here
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    const getInitials = (name: string) => {
        if (!name) return "?";
        const names = name.split(' ');
        if (names.length === 1) return names[0][0].toUpperCase();
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };

    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            {/* Sidebar Navigation */}
            <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
                <nav className="flex flex-col gap-2">
                    <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link href="/patients" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                        <Users className="h-4 w-4" />
                        Patients
                    </Link>
                    <Link href="/appointments" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                        <Calendar className="h-4 w-4" />
                        Appointments
                    </Link>
                    {/* Add other navigation links here */}
                </nav>
                <div className="mt-auto">
                    {/* Settings or other bottom items */}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col">
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:justify-end">
                    {/* Mobile Nav Trigger (Optional) */}
                    {/* ... */}

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                                {/* Add Avatar component if installed: npx shadcn@latest add avatar */} 
                                <Avatar className="h-8 w-8">
                                     <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" /> {/* Placeholder */} 
                                     <AvatarFallback>{doctor ? getInitials(doctor.name) : 'U'}</AvatarFallback>
                                </Avatar>
                                {/* Fallback if Avatar not installed yet */} 
                                {/* <span>{doctor ? getInitials(doctor.name) : 'U'}</span> */} 
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{doctor?.name || 'My Account'}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            {/* Add other items like Profile */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
} 