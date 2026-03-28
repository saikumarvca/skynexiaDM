'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Client {
  _id: string;
  businessName: string;
  name: string;
}

interface ExternalReview {
  _id: string;
  clientId: string;
  platform: string;
  authorName?: string;
  rating: number;
  text: string;
  reviewDate?: string;
  createdAt: string;
}

interface GooglePlaceReview {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
}

interface GoogleReviewsClientProps {
  clients: Client[];
  initialReviews: ExternalReview[];
}

export function GoogleReviewsClient({ clients, initialReviews }: GoogleReviewsClientProps) {
  const [clientId, setClientId] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [preview, setPreview] = useState<GooglePlaceReview[]>([]);
  const [loading, setLoading] = useState(false);

  const [manualClientId, setManualClientId] = useState('');
  const [manualJson, setManualJson] = useState('');
  const [manualPlatform, setManualPlatform] = useState('OTHER');
  const [manualLoading, setManualLoading] = useState(false);

  const [importedReviews, setImportedReviews] = useState<ExternalReview[]>(initialReviews);
  const [filterClient, setFilterClient] = useState('');

  async function handleFetchPreview() {
    if (!placeId || !clientId) {
      toast.error('Select a client and enter a Place ID');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, clientId, preview: true, apiKey: apiKey || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch reviews');
      setPreview(data.reviews ?? []);
      toast.success(`Found ${data.count} reviews`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  }

  async function handleImportGoogle() {
    if (!placeId || !clientId) {
      toast.error('Select a client and enter a Place ID');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, clientId, apiKey: apiKey || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to import reviews');
      toast.success(`Imported ${data.imported} new reviews (${data.total} total found)`);
      setPreview([]);
      await refreshReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error importing reviews');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualImport() {
    if (!manualClientId || !manualJson.trim()) {
      toast.error('Select a client and paste JSON');
      return;
    }
    let reviews;
    try {
      reviews = JSON.parse(manualJson);
      if (!Array.isArray(reviews)) throw new Error('Must be a JSON array');
    } catch {
      toast.error('Invalid JSON. Expected an array of reviews.');
      return;
    }
    setManualLoading(true);
    try {
      const res = await fetch('/api/google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews, clientId: manualClientId, platform: manualPlatform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to import');
      toast.success(`Imported ${data.imported} reviews`);
      setManualJson('');
      await refreshReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error importing');
    } finally {
      setManualLoading(false);
    }
  }

  async function refreshReviews() {
    try {
      const q = filterClient ? `?clientId=${filterClient}` : '';
      const res = await fetch(`/api/google-reviews${q}`);
      if (res.ok) {
        const data = await res.json();
        setImportedReviews(data);
      }
    } catch {
      // ignore refresh errors
    }
  }

  const filteredReviews = filterClient
    ? importedReviews.filter((r) => r.clientId === filterClient)
    : importedReviews;

  return (
    <Tabs defaultValue="google">
      <TabsList>
        <TabsTrigger value="google">Import from Google</TabsTrigger>
        <TabsTrigger value="manual">Manual Import</TabsTrigger>
        <TabsTrigger value="imported">Imported Reviews ({importedReviews.length})</TabsTrigger>
      </TabsList>

      {/* Tab 1: Google Import */}
      <TabsContent value="google" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Import from Google Places</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Google Place ID</label>
              <Input
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Find your Place ID at{' '}
                <a
                  href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Place ID Finder
                </a>
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Google API Key (optional — uses server env if not provided)
              </label>
              <Input
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleFetchPreview} disabled={loading}>
                {loading ? 'Fetching...' : 'Preview Reviews'}
              </Button>
              <Button onClick={handleImportGoogle} disabled={loading}>
                {loading ? 'Importing...' : 'Import Reviews'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({preview.length} reviews)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preview.map((r, i) => (
                <div key={i} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.author_name ?? 'Anonymous'}</span>
                    <span className="text-muted-foreground">{'★'.repeat(r.rating ?? 0)}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{r.text ?? 'No text'}</p>
                  {r.relative_time_description && (
                    <p className="mt-1 text-xs text-muted-foreground">{r.relative_time_description}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Tab 2: Manual Import */}
      <TabsContent value="manual" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Manual JSON Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Client</label>
              <select
                value={manualClientId}
                onChange={(e) => setManualClientId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Platform</label>
              <select
                value={manualPlatform}
                onChange={(e) => setManualPlatform(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="GOOGLE">Google</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Reviews JSON</label>
              <textarea
                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                placeholder={`[\n  { "text": "Great service!", "author": "Jane Doe", "rating": 5, "date": "2024-01-15" },\n  { "text": "Very helpful.", "author": "John Smith", "rating": 4 }\n]`}
                value={manualJson}
                onChange={(e) => setManualJson(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Format: array of objects with <code>text</code> (required), <code>rating</code> (required),{' '}
                <code>author</code>, <code>date</code>
              </p>
            </div>
            <Button onClick={handleManualImport} disabled={manualLoading}>
              {manualLoading ? 'Importing...' : 'Import Reviews'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 3: Imported Reviews */}
      <TabsContent value="imported" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Imported Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <select
                value={filterClient}
                onChange={(e) => {
                  setFilterClient(e.target.value);
                }}
                className="flex h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">All clients</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={refreshReviews}>
                Refresh
              </Button>
            </div>
            {filteredReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No imported reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {filteredReviews.map((r) => (
                  <div key={r._id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.platform}</span>
                        {r.authorName && <span className="font-medium">{r.authorName}</span>}
                      </div>
                      <span className="text-muted-foreground">{'★'.repeat(Math.min(r.rating, 5))}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground line-clamp-2">{r.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.reviewDate
                        ? new Date(r.reviewDate).toLocaleDateString()
                        : new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
