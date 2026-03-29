import { DashboardLayout } from "@/components/dashboard-layout";
import { ItemMasterManager } from "@/components/settings/item-master-manager";

export default function ItemMasterPage() {
  return (
    <DashboardLayout>
      <ItemMasterManager />
    </DashboardLayout>
  );
}
