import { notFound } from "next/navigation";
import NewInvoicePage from "@/app/dashboard/invoices/new/page";
import AccountsReceivablePage from "@/app/dashboard/invoices/accounts-receivable/page";
import InvoiceDetailPage from "@/app/dashboard/invoices/[invoiceId]/page";

export default async function InvoicesSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  const AnyNewInvoicePage = NewInvoicePage as any;
  const AnyAccountsReceivablePage = AccountsReceivablePage as any;
  const AnyInvoiceDetailPage = InvoiceDetailPage as any;
  if (path === "new") return <AnyNewInvoicePage searchParams={searchParams} />;
  if (path === "accounts-receivable") return <AnyAccountsReceivablePage searchParams={searchParams} />;
  if (slug.length === 1) {
    return (
      <AnyInvoiceDetailPage
        params={Promise.resolve({ invoiceId: slug[0] })}
        searchParams={searchParams}
      />
    );
  }
  notFound();
}
