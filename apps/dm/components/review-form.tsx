"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReviewFormData } from "@/types"

interface ReviewFormProps {
  clientId: string
  onSubmit: (data: ReviewFormData) => Promise<void>
}

export function ReviewForm({ clientId, onSubmit }: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ReviewFormData>({
    clientId,
    shortLabel: "",
    reviewText: "",
    category: "",
    language: "English",
    ratingStyle: "5-star",
  })

  const [templates, setTemplates] = useState<{ _id: string; name: string; suggestedCategory?: string; suggestedLanguage?: string; suggestedRatingStyle?: string }[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates')
        if (!res.ok) return
        const data = await res.json()
        setTemplates(data)
      } catch (error) {
        console.error('Error fetching templates:', error)
      }
    }
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (!selectedTemplateId) return
    const template = templates.find(t => t._id === selectedTemplateId)
    if (!template) return

    setFormData(prev => ({
      ...prev,
      category: template.suggestedCategory || prev.category,
      language: template.suggestedLanguage || prev.language,
      ratingStyle: template.suggestedRatingStyle || prev.ratingStyle,
    }))
  }, [selectedTemplateId, templates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        clientId,
        shortLabel: "",
        reviewText: "",
        category: "",
        language: "English",
        ratingStyle: "5-star",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof ReviewFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {templates.length > 0 && (
          <div className="md:col-span-2">
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Template (optional)
            </label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template to prefill fields" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template._id} value={template._id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <label htmlFor="shortLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Short Label
          </label>
          <Input
            id="shortLabel"
            value={formData.shortLabel}
            onChange={(e) => handleChange("shortLabel", e.target.value)}
            placeholder="e.g., Great service review"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            placeholder="e.g., Service, Product, Experience"
            required
          />
        </div>
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Language
          </label>
          <Select value={formData.language} onValueChange={(value) => handleChange("language", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="ratingStyle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rating Style
          </label>
          <Select value={formData.ratingStyle} onValueChange={(value) => handleChange("ratingStyle", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5-star">5-Star</SelectItem>
              <SelectItem value="4-star">4-Star</SelectItem>
              <SelectItem value="3-star">3-Star</SelectItem>
              <SelectItem value="thumbs-up">Thumbs Up</SelectItem>
              <SelectItem value="heart">Heart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Review Text
        </label>
        <Textarea
          id="reviewText"
          value={formData.reviewText}
          onChange={(e) => handleChange("reviewText", e.target.value)}
          rows={6}
          placeholder="Enter the full review text here..."
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Review"}
        </Button>
      </div>
    </form>
  )
}