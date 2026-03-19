"use client"

import { SignupForm1 } from "./components/signup-form-1"
import { Logo } from "@/components/logo"
import { MoleculeCanvas } from "@/components/molecule-canvas"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div
      className="min-h-svh flex items-center justify-center relative overflow-hidden"
      style={{ background: "#0a0e1a" }}
    >
      <MoleculeCanvas />

      {/* Glow orbs */}
      <div
        className="absolute top-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "rgba(0,198,255,0.08)", filter: "blur(100px)" }}
      />
      <div
        className="absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "rgba(0,100,255,0.1)", filter: "blur(100px)" }}
      />

      <div className="w-full max-w-md px-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-[#00c6ff] text-black flex size-9 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-105">
              <Logo size={22} />
            </div>
            <span className="text-white font-semibold text-lg">Ebolt</span>
          </Link>
        </div>

        <SignupForm1 />

        <p className="text-center text-sm mt-6 text-[#6b7a99]">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-[#00c6ff] hover:opacity-80 transition-opacity"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
