import type { ReactNode } from 'react';
import { verifyPortalToken } from '@/lib/portal-auth';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Link from 'next/link';

interface PortalLayoutProps {
  children: ReactNode;
  params: Promise<{ token: string }>;
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { token } = await params;

  const clientId = verifyPortalToken(token);
  if (!clientId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-500">This portal link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  let clientName = 'Client Portal';
  try {
    await dbConnect();
    const client = await Client.findById(clientId).select('name businessName').lean();
    if (client) {
      clientName = (client as { businessName?: string; name?: string }).businessName ??
        (client as { name?: string }).name ?? 'Client Portal';
    }
  } catch {
    // continue with default name
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-900">{clientName}</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              Client Portal
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href={`/portal/${token}`}
              className="text-gray-600 hover:text-gray-900"
            >
              Overview
            </Link>
            <Link
              href={`/portal/${token}/campaigns`}
              className="text-gray-600 hover:text-gray-900"
            >
              Campaigns
            </Link>
            <Link
              href={`/portal/${token}/reviews`}
              className="text-gray-600 hover:text-gray-900"
            >
              Reviews
            </Link>
          </nav>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
