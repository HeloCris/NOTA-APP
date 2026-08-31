import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-canvas p-6 sm:p-8">
      <section className="flex min-h-[700px] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border-sandstone bg-surface-porcelain shadow-auth">
        <div className="flex flex-1 flex-col justify-center bg-surface-porcelain p-8 sm:p-12 md:p-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex justify-center">
              <img
                src="/logo.png"
                alt="NŌTA"
                className="h-10 w-auto object-contain"
              />
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}