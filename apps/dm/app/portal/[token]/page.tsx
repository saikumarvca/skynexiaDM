import { verifyPortalToken } from '@/lib/portal-auth';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Campaign from '@/models/Campaign';
import Review from '@/models/Review';
import { notFound } from 'next/navigation';

interface PortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function PortalOverviewPage({ params }: PortalPageProps) {
  const { token } = await params;
  const clientId = verifyPortalToken(token);
  if (!clientId) notFound();

  await dbConnect();

  const [client, campaigns, reviews] = await Promise.all([
    Client.findById(clientId).lean(),
    Campaign.find({ clientId }).lean(),
    Review.find({ clientId }).lean(),
  ]);

  if (!client) notFound();

  const c = client as {
    name: string;
    businessName: string;
    industry?: string;
    location?: string;
    website?: string;
    status: string;
  };

  const activeCampaigns = campaigns.filter(
    (camp) => (camp as { status?: string }).status === 'ACTIVE'
  ).length;

  const reviewCount = reviews.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{c.businessName}</h1>
        {c.industry && (
          <p className="mt-1 text-gray-500">
            {c.industry}
            {c.location ? ` · ${c.location}` : ''}
          </p>
        )}
        {c.website && (
          <a
            href={c.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-sm text-blue-600 hover:underline"
          >
            {c.website}
          </a>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Campaigns</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{campaigns.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active Campaigns</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{activeCampaigns}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Reviews</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{reviewCount}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Account Status</h2>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            c.status === 'ACTIVE'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {c.status}
        </span>
      </div>
    </div>
  );
}
