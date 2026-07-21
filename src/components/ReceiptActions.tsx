"use client";
import { PrintButton } from "./PrintBillButton";
import { RenewButton } from "./RenewButton";
import { useRouter } from "@/i18n/routing";

export function ReceiptActions({
  memberId,
}: {
  memberId: string;
  monthlyPrice?: number;
}) {
  const router = useRouter();

  return (
    <div className="no-print flex flex-wrap gap-2 justify-end mb-4">
      <PrintButton />
      <RenewButton
        memberId={memberId}
        label="Renew & print new bill"
        onRenewed={(periodId) => {
          router.push(`/members/${memberId}/receipt?period=${periodId}`);
        }}
      />
    </div>
  );
}
