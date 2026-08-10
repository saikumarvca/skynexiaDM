import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";

export async function getActiveTeamManagers(): Promise<
  { _id: string; name: string }[]
> {
  await dbConnect();
  const items = await TeamMember.find({
    status: "Active",
    isDeleted: { $ne: true },
  })
    .select("_id name")
    .sort({ name: 1 })
    .lean();
  return JSON.parse(JSON.stringify(items)) as { _id: string; name: string }[];
}
