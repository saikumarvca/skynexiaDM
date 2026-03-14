"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { MarkUsedModal } from "@/components/mark-used-modal"
import { Review, MarkUsedFormData } from "@/types"
import { Copy, CheckCircle, Archive } from "lucide-react"

interface ReviewTableProps {
  reviews: Review[]
  onMarkUsed: (data: MarkUsedFormData) => Promise<void>
  onArchive: (reviewId: string) => Promise<void>
  onCopy?: (text: string) => void
}

export function ReviewTable({ reviews, onMarkUsed, onArchive, onCopy }: ReviewTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCopy = async (review: Review) => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(review.reviewText)
      }
    } catch (error) {
      console.error("Failed to copy review text:", error)
    }

    if (onCopy) {
      onCopy(review.reviewText)
    }

    setSelectedReview(review)
    setIsModalOpen(true)
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.shortLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.reviewText.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || review.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleMarkUsed = (review: Review) => {
    setSelectedReview(review)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (data: MarkUsedFormData) => {
    await onMarkUsed(data)
  }

  const handleArchive = async (reviewId: string) => {
    if (confirm("Are you sure you want to archive this review?")) {
      await onArchive(reviewId)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="UNUSED">Unused</SelectItem>
              <SelectItem value="USED">Used</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.map((review) => (
              <TableRow key={review._id}>
                <TableCell className="font-medium">{review.shortLabel}</TableCell>
                <TableCell>{review.category}</TableCell>
                <TableCell>{review.language}</TableCell>
                <TableCell>{review.ratingStyle}</TableCell>
                <TableCell>
                  <StatusBadge status={review.status} />
                </TableCell>
                <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(review)}
                      title="Copy review text"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {review.status === 'UNUSED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkUsed(review)}
                        title="Mark as used"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(review._id)}
                      title="Archive review"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No reviews found matching your criteria.
        </div>
      )}

      <MarkUsedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reviewId={selectedReview?._id || ""}
        onSubmit={handleModalSubmit}
      />
    </>
  )
}