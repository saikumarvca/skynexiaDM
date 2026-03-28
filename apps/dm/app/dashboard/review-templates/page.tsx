import Link from "next/link"
import { revalidatePath } from "next/cache"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TemplateForm } from "@/components/template-form"
import { serverFetch } from "@/lib/server-fetch"
import { ReviewTemplate } from "@/types"
import { DeleteTemplateButton } from "@/components/review-templates/delete-template-button"
import { LayoutTemplate } from "lucide-react"

async function getTemplates(): Promise<ReviewTemplate[]> {
  const res = await serverFetch("/api/templates")
  if (!res.ok) return []
  return res.json()
}

function formDataToTemplateBody(formData: FormData) {
  const g = (k: string) => {
    const v = formData.get(k)
    return typeof v === "string" ? v.trim() : ""
  }
  return {
    name: g("name"),
    description: g("description") || undefined,
    industry: g("industry") || undefined,
    tone: g("tone") || undefined,
    platform: g("platform") || undefined,
    suggestedCategory: g("suggestedCategory") || undefined,
    suggestedLanguage: g("suggestedLanguage") || undefined,
    suggestedRatingStyle: g("suggestedRatingStyle") || undefined,
  }
}

export default async function ReviewTemplatesPage() {
  const templates = await getTemplates()

  async function createTemplate(formData: FormData) {
    "use server"
    const body = formDataToTemplateBody(formData)
    if (!body.name) throw new Error("Name is required")
    const res = await serverFetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || "Failed to create template")
    }
    revalidatePath("/dashboard/review-templates")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review templates</h1>
          <p className="text-muted-foreground">
            Prefill review fields when writers pick a template on the new-review form.
          </p>
        </div>

        <TemplateForm action={createTemplate} title="New template" submitLabel="Create template" />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutTemplate className="h-5 w-5" />
              All templates ({templates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {templates.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No templates yet. Create one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Category</th>
                      <th className="p-3 font-medium">Language</th>
                      <th className="p-3 font-medium">Platform</th>
                      <th className="w-28 p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t) => (
                      <tr key={t._id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{t.name}</td>
                        <td className="p-3 text-muted-foreground">{t.suggestedCategory ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{t.suggestedLanguage ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{t.platform ?? "—"}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/review-templates/${t._id}/edit`}>Edit</Link>
                            </Button>
                            <DeleteTemplateButton templateId={t._id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
