import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ExternalReview from "@/models/ExternalReview";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;

    const reviews = await ExternalReview.find(query).sort({ reviewDate: -1 });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching external reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch external reviews" },
      { status: 500 },
    );
  }
}

interface GooglePlaceReview {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;
  relative_time_description?: string;
}

interface ManualReview {
  text: string;
  author?: string;
  rating: number;
  date?: string;
}

export async function POST(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    await dbConnect();
    const body = await request.json();

    // Handle Google Places API fetch
    if (body.placeId && body.clientId && !body.reviews) {
      const apiKey = body.apiKey || process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            error:
              "Google Places API key not configured. Set GOOGLE_PLACES_API_KEY environment variable or provide apiKey in the request.",
          },
          { status: 400 },
        );
      }

      const placeDetailsUrl =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${encodeURIComponent(body.placeId)}` +
        `&fields=reviews` +
        `&key=${apiKey}`;

      const gRes = await fetch(placeDetailsUrl);
      if (!gRes.ok) {
        return NextResponse.json(
          { error: `Google Places API error: ${gRes.statusText}` },
          { status: 502 },
        );
      }
      const gData = (await gRes.json()) as {
        status: string;
        result?: { reviews?: GooglePlaceReview[] };
        error_message?: string;
      };
      if (gData.status !== "OK") {
        return NextResponse.json(
          {
            error: `Google Places API error: ${gData.status} - ${gData.error_message ?? ""}`,
          },
          { status: 400 },
        );
      }

      const googleReviews: GooglePlaceReview[] = gData.result?.reviews ?? [];

      if (body.preview) {
        // Return preview without saving
        return NextResponse.json({
          reviews: googleReviews,
          count: googleReviews.length,
        });
      }

      // Save to database
      const saved = [];
      for (const gr of googleReviews) {
        const existing = await ExternalReview.findOne({
          clientId: body.clientId,
          platform: "GOOGLE",
          authorName: gr.author_name,
          text: gr.text,
        });
        if (!existing) {
          const rev = new ExternalReview({
            clientId: body.clientId,
            platform: "GOOGLE",
            authorName: gr.author_name,
            rating: gr.rating ?? 0,
            text: gr.text ?? "",
            reviewDate: gr.time ? new Date(gr.time * 1000) : undefined,
            lastSyncedAt: new Date(),
          });
          await rev.save();
          saved.push(rev);
        }
      }

      return NextResponse.json(
        { imported: saved.length, total: googleReviews.length },
        { status: 201 },
      );
    }

    // Handle manual import (array of reviews)
    if (Array.isArray(body.reviews) && body.clientId) {
      const reviews: ManualReview[] = body.reviews;
      const saved = [];
      for (const r of reviews) {
        if (!r.text || typeof r.rating !== "number") continue;
        const rev = new ExternalReview({
          clientId: body.clientId,
          platform: body.platform ?? "OTHER",
          authorName: r.author,
          rating: r.rating,
          text: r.text,
          reviewDate: r.date ? new Date(r.date) : undefined,
          lastSyncedAt: new Date(),
        });
        await rev.save();
        saved.push(rev);
      }
      return NextResponse.json({ imported: saved.length }, { status: 201 });
    }

    // Fallback: legacy single review creation
    const review = new ExternalReview(body);
    await review.save();
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating external review:", error);
    return NextResponse.json(
      { error: "Failed to create external review" },
      { status: 500 },
    );
  }
}
