import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReviewAllocation from "@/models/ReviewAllocation";
import ReviewDraft from "@/models/ReviewDraft";
import PostedReview from "@/models/PostedReview";
import Review from "@/models/Review";
import { logActivity } from "@/lib/review-activity";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { markPostedSchema } from "@/lib/api/schemas";
import { andFilters } from "@/lib/team/scope-filters";
import { findReviewAllocationForMutation } from "@/lib/reviews/review-mutation-scope";
import { decideMarkPosted } from "@/lib/reviews/review-state-machine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isDuplicateKey(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 11000
  );
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const scoped = await findReviewAllocationForMutation(request, id);
    if (scoped.denied) return scoped.denied;

    await dbConnect();

    const existing = scoped.allocation;
    if (!existing || !scoped.scopeFilter) {
      return apiError(404, "Allocation not found", "NOT_FOUND");
    }

    const parsed = await parseWithSchema(request, markPostedSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const {
      postedByName,
      customerContact,
      platform,
      reviewLink,
      proofUrl,
      postedDate,
      markedUsedBy,
      remarks,
      performedBy = "system",
    } = body;

    const decision = decideMarkPosted(existing.allocationStatus);
    if (decision.kind === "invalid") {
      return apiError(
        409,
        `Cannot mark allocation as posted from status "${decision.from}"`,
        "CONFLICT",
        { from: decision.from, to: decision.to },
      );
    }

    const actualPostedDate = new Date(postedDate);
    let didTransition = decision.kind === "transition";

    if (didTransition) {
      const claimed = await ReviewAllocation.findOneAndUpdate(
        andFilters(scoped.scopeFilter, {
          allocationStatus: "Shared with Customer",
        }),
        {
          allocationStatus: "Posted",
          postedDate: actualPostedDate,
          usedDate: actualPostedDate,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!claimed) {
        const current = await ReviewAllocation.findOne(scoped.scopeFilter);
        if (!current) {
          return apiError(404, "Allocation not found", "NOT_FOUND");
        }
        const currentDecision = decideMarkPosted(current.allocationStatus);
        if (currentDecision.kind !== "idempotent") {
          return apiError(
            409,
            `Allocation state changed to "${current.allocationStatus}"`,
            "CONFLICT",
          );
        }
        didTransition = false;
      }
    }

    const current = await ReviewAllocation.findOne(scoped.scopeFilter);
    if (!current) {
      return apiError(404, "Allocation not found", "NOT_FOUND");
    }

    // The allocation transition is the claim/lock. PostedReview uses a
    // deterministic _id equal to the allocation id for newly-created rows,
    // so concurrent repair/upsert attempts cannot create duplicate canonical
    // records even without replica-set transactions.
    let postedReview = await PostedReview.findOne({ allocationId: current._id });
    if (!postedReview) {
      try {
        postedReview = await PostedReview.findOneAndUpdate(
          { allocationId: current._id },
          {
            $setOnInsert: {
              _id: current._id,
              agencyId: current.agencyId ?? null,
              allocationId: current._id,
              draftId: current.draftId,
              postedByName: postedByName.trim(),
              customerContact: customerContact?.trim() || undefined,
              platform: platform.trim(),
              reviewLink: reviewLink?.trim() || undefined,
              proofUrl: proofUrl?.trim() || undefined,
              postedDate: actualPostedDate,
              markedUsedBy: markedUsedBy || performedBy,
              remarks: remarks?.trim(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        postedReview = await PostedReview.findOne({ allocationId: current._id });
      }
    }

    if (!postedReview) {
      return apiError(
        500,
        "Posted review could not be reconciled",
        "INTERNAL_ERROR",
      );
    }

    // Repair-safe: if an earlier attempt claimed the allocation but stopped
    // before updating the draft, every retry converges the draft to Used.
    await ReviewDraft.findByIdAndUpdate(current.draftId, {
      status: "Used",
      updatedAt: new Date(),
    });

    const draft = await ReviewDraft.findById(current.draftId).lean();

    // Secondary compatibility side effect. Only the request that won the
    // Shared -> Posted state transition attempts the legacy Review bridge.
    if (didTransition && draft) {
      await Review.create({
        clientId: draft.clientId,
        shortLabel: draft.subject,
        reviewText: draft.reviewText,
        category: draft.category,
        language: draft.language,
        ratingStyle: draft.suggestedRating ?? "5",
        status: "USED",
        platform: platform.trim(),
        source: "IMPORT",
        usedCount: 1,
      }).catch((err: unknown) => {
        console.warn("Failed to bridge draft to Review model:", err);
      });

      await logActivity({
        entityType: "POSTED_REVIEW",
        entityId: postedReview._id.toString(),
        action: "CREATE",
        newValue: postedReview.toObject(),
        performedBy: markedUsedBy || performedBy,
      });

      await logActivity({
        entityType: "ALLOCATION",
        entityId: id,
        action: "MARK_POSTED",
        oldValue: existing.toObject(),
        newValue: {
          allocationStatus: "Posted",
          postedDate: actualPostedDate,
        },
        performedBy: markedUsedBy || performedBy,
      });
    }

    const allocation = await ReviewAllocation.findOne(scoped.scopeFilter).populate(
      "draftId",
      "subject reviewText clientName",
    );

    return NextResponse.json({
      allocation,
      postedReview,
      idempotent: !didTransition,
    });
  } catch (error) {
    console.error("Error marking allocation as posted:", error);
    return apiError(500, "Failed to mark as posted", "INTERNAL_ERROR");
  }
}
