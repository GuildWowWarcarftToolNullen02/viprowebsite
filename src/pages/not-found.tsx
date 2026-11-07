import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function NotFound() {
  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <AlertCircle className="w-16 h-16 text-white mb-6 opacity-80" />
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">404 NOT FOUND</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          The operation requested a path that does not exist in the current directory structure.
        </p>
        <Link href="/" className="btn-secondary">
          Return to Hub
        </Link>
      </div>
    </PageWrapper>
  );
}
