"use client";

import type { DefaultCellComponentProps } from "payload";

export function ResponsiveList() {
  return (
    <p className="makeon-responsive-list">
      Glisează tabelul pentru mai multe coloane{" "}
      <span aria-hidden="true">↔</span>
    </p>
  );
}

/** Product prices are already in RON; unlike order amounts, do not divide by 100. */
export function ProductPriceCell({ cellData }: DefaultCellComponentProps) {
  return (
    <span>
      {typeof cellData === "number"
        ? new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: "RON",
          }).format(cellData)
        : "La cerere"}
    </span>
  );
}

/** Display integer-bani order snapshots in RON without changing stored values. */
export function OrderAmountCell({ cellData }: DefaultCellComponentProps) {
  return (
    <span>
      {typeof cellData === "number"
        ? new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: "RON",
          }).format(cellData / 100)
        : "—"}
    </span>
  );
}
