"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Client } from "@/types";

export function CollapsibleClientInfo({ client }: { client: Client }) {
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Client Information</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setOpen((p) => !p)}>
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      {open && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Business Name
              </label>
              <p className="mt-1">{client.businessName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Brand Name
              </label>
              <p className="mt-1">{client.brandName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Contact Name
              </label>
              <p className="mt-1">{client.contactName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-1">{client.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1">{client.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <div className="mt-1">
                <StatusBadge status={client.status} />
              </div>
            </div>
            {client.notes && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">
                  Notes
                </label>
                <p className="mt-1">{client.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
