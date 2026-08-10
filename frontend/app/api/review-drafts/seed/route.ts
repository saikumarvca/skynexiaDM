import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import PostedReview from "@/models/PostedReview";
import User from "@/models/User";
import { getOrCreateUnassignedClient } from "@/lib/reviews/unassigned-client";

const SAMPLE_DRAFTS = [
  {
    subject: "Excellent GST Filing Support",
    reviewText:
      "VR Filings helped us with GST registration and return filing smoothly. Their team explained the entire process clearly and completed everything on time. Highly recommended for businesses looking for reliable GST compliance support.",
  },
  {
    subject: "Professional Company Registration Service",
    reviewText:
      "I had a great experience registering my company with VR Filings. The team handled documentation, approvals, and compliance professionally. The process was smooth and well guided.",
  },
  {
    subject: "Reliable Compliance Partner",
    reviewText:
      "VR Filings has been very helpful in managing our business compliance. Their team is knowledgeable in GST, ROC filings, and tax matters. Communication is clear and the service is dependable.",
  },
  {
    subject: "Quick and Efficient Service",
    reviewText:
      "The team at VR Filings provides quick and efficient service. They handled our tax filing and compliance tasks without delays. Very professional and supportive team.",
  },
  {
    subject: "Great Support for Startups",
    reviewText:
      "VR Filings provides excellent support for startups. They guided us through company registration, GST registration, and compliance requirements in a very simple way.",
  },
  {
    subject: "Smooth ROC Filing Experience",
    reviewText:
      "ROC compliance and filings were handled smoothly by the VR Filings team. The process was hassle-free and they ensured everything was submitted correctly.",
  },
  {
    subject: "Excellent Customer Support",
    reviewText:
      "Whenever we had questions, the VR Filings team responded quickly and explained everything clearly. Their support and professionalism are highly appreciated.",
  },
  {
    subject: "Trusted Business Compliance Services",
    reviewText:
      "VR Filings is a trustworthy service provider for business compliance. Their expertise in GST, taxation, and company filings helped our business stay compliant.",
  },
  {
    subject: "Smooth GST Registration Process",
    reviewText:
      "GST registration was completed very smoothly with the help of VR Filings. The team guided us through the entire process and handled the paperwork professionally.",
  },
  {
    subject: "Knowledgeable and Professional Team",
    reviewText:
      "The team at VR Filings has strong knowledge in taxation and compliance. They provided useful advice and handled our filings efficiently.",
  },
  {
    subject: "Efficient Tax Filing Assistance",
    reviewText:
      "VR Filings assisted us with income tax filing and compliance. The entire process was handled professionally and completed within the expected time.",
  },
  {
    subject: "Very Organized Documentation Support",
    reviewText:
      "All documentation and filing requirements were managed properly by VR Filings. Their organized approach made the entire process easy for us.",
  },
  {
    subject: "Reliable GST Return Filing",
    reviewText:
      "GST return filing with VR Filings was very smooth. The team ensured everything was filed correctly and on time. Highly reliable service.",
  },
  {
    subject: "Professional Guidance for Entrepreneurs",
    reviewText:
      "VR Filings provides excellent guidance for entrepreneurs starting a business. Their advice on compliance and registration was very helpful.",
  },
  {
    subject: "Excellent Business Compliance Support",
    reviewText:
      "The VR Filings team helped us manage several compliance requirements efficiently. Their knowledge and professionalism make them a great partner for businesses.",
  },
];

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const client = await getOrCreateUnassignedClient();

    const clientName = client.businessName ?? client.name;
    const body = await request.json().catch(() => ({}));
    const demoOnly = body.demoOnly === true;

    const created: { draftId: string }[] = [];

    if (demoOnly) {
      const user = await User.findOne({ isActive: true });
      const userId = user?._id?.toString() ?? "system";
      const userName = user?.name ?? "Rahul";
      const first = SAMPLE_DRAFTS[0]!;

      const draft = new ReviewDraft({
        subject: first.subject,
        reviewText: first.reviewText,
        clientId: client._id,
        clientName,
        category: "Service",
        language: "English",
        suggestedRating: "5",
        tone: "Professional",
        reusable: true,
        status: "Used",
        createdBy: "system",
      });
      await draft.save();

      const allocation = new ReviewAllocation({
        draftId: draft._id,
        assignedToUserId: userId,
        assignedToUserName: userName,
        assignedByUserId: userId,
        assignedByUserName: userName,
        customerName: "Praveen",
        platform: "Google",
        allocationStatus: "Used",
        assignedDate: new Date(),
        sentDate: new Date(),
        postedDate: new Date(),
        usedDate: new Date(),
      });
      await allocation.save();

      const posted = new PostedReview({
        allocationId: allocation._id,
        draftId: draft._id,
        postedByName: "Praveen",
        platform: "Google",
        reviewLink: "https://example.com/review",
        proofUrl: "https://example.com/proof",
        postedDate: new Date(),
        markedUsedBy: userName,
        remarks: "Demo seed record",
      });
      await posted.save();

      created.push({ draftId: draft._id.toString() });
    } else {
      for (const item of SAMPLE_DRAFTS) {
        const draft = new ReviewDraft({
          subject: item.subject,
          reviewText: item.reviewText,
          clientId: client._id,
          clientName,
          category: "Service",
          language: "English",
          suggestedRating: "5",
          tone: "Professional",
          reusable: true,
          status: "Available",
          createdBy: "system",
        });
        await draft.save();
        created.push({ draftId: draft._id.toString() });
      }
    }

    return NextResponse.json({
      message: demoOnly
        ? "Demo seed created"
        : `Created ${created.length} review drafts`,
      count: created.length,
      draftIds: created.map((c) => c.draftId),
    });
  } catch (error) {
    console.error("Error seeding review drafts:", error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
