import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/client-portal/change-password-form";

export default function ClientPortalPasswordPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/client-portal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to review progress
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Choose a new password for your client login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
