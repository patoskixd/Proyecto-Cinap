"use client";
import LoginForm from "@/presentation/components/auth/LoginForm";
import { useState } from "react";
import { useRouter } from "next/navigation"; 

export default function LoginPage() {
  return (
    <>
    <LoginForm/>
    </>
  );
}
