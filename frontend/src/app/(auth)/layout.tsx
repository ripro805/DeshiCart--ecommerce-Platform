import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:px-0">
        {/* Left brand panel */}
        <div className="relative hidden overflow-hidden bg-secondary lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary-400/20 to-accent/30" />
          <div className="relative flex h-full flex-col p-12 text-white">
            <Link href="/" className="text-2xl font-bold">
              <span className="bg-gradient-to-br from-accent via-primary-400 to-accent bg-clip-text text-transparent">
                Deshi
              </span>
              Cart
            </Link>
            <div className="mt-auto">
              <p className="text-display-lg text-balance">Welcome to DeshiCart.</p>
              <p className="mt-4 max-w-md text-white/70">
                Premium Bangladeshi products, secure checkout, fast delivery. Sign in to your account
                to track orders and manage your wishlist.
              </p>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
