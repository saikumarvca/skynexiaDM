import { redirect } from "next/navigation";
import { DOCUMENTATION_BASE_PATH } from "./documentation-data";

export const dynamic = "force-dynamic";

export default function DocumentationIndexPage() {
  redirect(`${DOCUMENTATION_BASE_PATH}/overview`);
}
