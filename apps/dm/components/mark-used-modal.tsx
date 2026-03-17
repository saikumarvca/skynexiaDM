"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { MarkUsedFormData } from "@/types"

interface MarkUsedModalProps {
  isOpen: boolean
  onClose: () => void
  reviewId: string
  onSubmit: (data: MarkUsedFormData) => Promise<void>
}

export function MarkUsedModal({ isOpen, onClose, reviewId, onSubmit }: MarkUsedModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<MarkUsedFormData>({
    reviewId,
    sourceName: "",
    usedBy: "",
    profileName: "",
    usedAt: new Date().toLocaleDateString('en-CA'), // Today's date in YYYY-MM-DD format
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      onClose()
      // Reset form
      setFormData({
        reviewId,
        sourceName: "",
        usedBy: "",
        profileName: "",
        usedAt: new Date().toLocaleDateString('en-CA'),
        notes: "",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof MarkUsedFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Review as Used</DialogTitle>
          <DialogDescription>
            Add where and when this review was used.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sourceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Source Platform
            </label>
            <Select value={formData.sourceName} onValueChange={(value) => handleChange("sourceName", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Justdial">Justdial</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Twitter">Twitter</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="usedBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Used By (Team Member)
            </label>
            <Input
              id="usedBy"
              value={formData.usedBy}
              onChange={(e) => handleChange("usedBy", e.target.value)}
              placeholder="Enter team member name"
              required
            />
          </div>
          <div>
            <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile/Account Name
            </label>
            <Input
              id="profileName"
              value={formData.profileName}
              onChange={(e) => handleChange("profileName", e.target.value)}
              placeholder="e.g., John Doe, @company"
              required
            />
          </div>
          <div>
            <label htmlFor="usedAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Used Date
            </label>
            <Input
              id="usedAt"
              type="date"
              value={formData.usedAt}
              onChange={(e) => handleChange("usedAt", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Marking..." : "Mark as Used"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}