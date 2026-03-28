import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TemplateForm } from "@/components/template-form"
import { serverFetch } from "@/lib/server-fetch"
import { ReviewTemplate } from "@/types"

async function getTemplate(id: string): Promise<ReviewTemplate | null> {
  const res = await serverFetch(`/api/templates/${id}`)
  if (!res.ok) return null
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

export default async function EditReviewTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params
  const template = await getTemplate(templateId)
  if (!template) notFound()

  async function updateTemplate(formData: FormData) {
    "use server"
    const body = formDataToTemplateBody(formData)
    if (!body.name) throw new Error("Name is required")
    const res = await serverFetch(`/api/templates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || "Failed to update template")
    }
    revalidatePath("/dashboard/review-templates")
    redirect("/dashboard/review-templates")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/review-templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit template</h1>
            <p className="text-muted-foreground">{template.name}</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <TemplateForm
            action={updateTemplate}
            initial={template}
            title="Template details"
            submitLabel="Save changes"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
