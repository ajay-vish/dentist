'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from "next/image";

export default function HomePage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the auth state is loaded
    if (!isLoading) {
      if (token) {
        router.replace('/dashboard'); // User is logged in
      } else {
        router.replace('/login'); // User is not logged in
      }
    }
  }, [token, isLoading, router]);

  // Render loading state or null while redirecting
  // You could show a full-page spinner here
  return <div>Loading...</div>;
}
