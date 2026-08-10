import { DashboardLayout } from "@/components/dashboard-layout";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import dbConnect from "@/lib/mongodb";
import FileAssetModel from "@/models/FileAsset";
import ClientModel from "@/models/Client";
import { FilesManager } from "@/components/files-manager";

export default async function ClientFilesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  await dbConnect();

  const [client, files] = await Promise.all([
    ClientModel.findById(clientId).lean(),
    FileAssetModel.find({ clientId }).sort({ uploadedAt: -1 }).lean(),
  ]);

  const serializedFiles = JSON.parse(JSON.stringify(files));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href={`/clients/${clientId}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to client
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground">
            {client
              ? `Brand assets and creative files for ${(client as { businessName?: string }).businessName ?? "this client"}.`
              : "Brand assets and creative files."}
          </p>
        </div>

        <FilesManager clientId={clientId} initialFiles={serializedFiles} />
      </div>
    </DashboardLayout>
  );
}
