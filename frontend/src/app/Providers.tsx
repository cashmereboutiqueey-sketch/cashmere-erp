"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ToastContainer from "@/components/ToastContainer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        {children}
        <ToastContainer />
      </LanguageProvider>
    </AuthProvider>
  );
}
