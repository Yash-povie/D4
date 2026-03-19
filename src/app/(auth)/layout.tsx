import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - NanoToxi AI",
  description: "Sign in to your NanoToxi AI research account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>{children}</>
  );
}
