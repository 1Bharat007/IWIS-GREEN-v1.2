"use client";

import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";
import { motion } from "framer-motion";

export default function SignupPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="min-h-[calc(100vh-48px)] flex items-center justify-center py-12 px-4">
      <SignUp
        routing="path"
        path="/signup"
        appearance={clerkAppearance}
        signInUrl="/login"
      />
    </motion.div>
  );
}
