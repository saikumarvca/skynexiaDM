"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkReviewFormData } from "@/types";

interface BulkReviewFormProps {
  clientId: string;
  onSubmit: (data: BulkReviewFormData) => Promise<void>;
}

export function BulkReviewForm({ clientId, onSubmit }: BulkReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BulkReviewFormData>({
    clientId,
    reviews: "",
    category: "",
    language: "English",
    ratingStyle: "5-star",
  });

  const [isPreviewOnly, setIsPreviewOnly] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreviewOnly) {
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        clientId,
        reviews: "",
        category: "",
        language: "English",
        ratingStyle: "5-star",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof BulkReviewFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parsedReviews = useMemo(() => {
    return formData.reviews
      .split(/\n\s*\n|\n/)
      .map((text) => text.trim())
      .filter((text) => text.length > 0)
      .map((text, index) => ({
        index: index + 1,
        text,
        isTooShort: text.length < 20,
      }));
  }, [formData.reviews]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Category
          </label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            placeholder="e.g., Service, Product"
            required
          />
        </div>
        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Language
          </label>
          <Select
            value={formData.language}
            onValueChange={(value) => handleChange("language", value)}
          >
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
          <label
            htmlFor="ratingStyle"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Rating Style
          </label>
          <Select
            value={formData.ratingStyle}
            onValueChange={(value) => handleChange("ratingStyle", value)}
          >
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
        <label
          htmlFor="reviews"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Reviews (one per line or separated by paragraphs)
        </label>
        <Textarea
          id="reviews"
          value={formData.reviews}
          onChange={(e) => handleChange("reviews", e.target.value)}
          rows={10}
          placeholder="Paste multiple reviews here. Each review should be on a new line or separated by blank lines."
          required
        />
        <p className="mt-2 text-sm text-gray-500">
          Each line or paragraph will be saved as a separate review.
        </p>
      </div>
      {parsedReviews.length > 0 && (
        <div className="rounded-md border p-4 space-y-2">
          <p className="text-sm font-medium">
            Preview ({parsedReviews.length} reviews)
          </p>
          <ul className="max-h-64 overflow-auto space-y-1 text-sm">
            {parsedReviews.map((item) => (
              <li
                key={item.index}
                className={item.isTooShort ? "text-red-500" : ""}
              >
                <span className="font-mono mr-2">#{item.index}</span>
                <span>{item.text}</span>
                {item.isTooShort && (
                  <span className="ml-2 text-xs">
                    (very short – consider expanding)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Reviews"}
        </Button>
      </div>
    </form>
  );
}
