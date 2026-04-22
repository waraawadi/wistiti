"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PaiementErreurPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-card rounded-[var(--radius-card)] border p-8 text-center">
        <XCircle className="mx-auto" size={56} style={{ color: "var(--color-primary)" }} />
        <h1 className="mt-4 text-2xl font-extrabold font-display">Paiement non finalisé</h1>
        <p className="mt-2 text-muted-foreground">
          Une erreur est survenue ou le paiement a été annulé. Tu peux réessayer.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/pricing">
            <Button variant="primary">Réessayer</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Retour dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

