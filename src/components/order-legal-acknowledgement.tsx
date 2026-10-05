"use client";
import { legal } from "@/lib/legal";

export default function OrderLegalAcknowledgement({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="order-legal-acknowledgement">
      <input
        type="checkbox"
        name="termsAccepted"
        required
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        Accept{" "}
        <a href={legal.terms} target="_blank" rel="noopener noreferrer">
          Termenii și condițiile
        </a>{" "}
        și confirm că am citit{" "}
        <a href={legal.privacy} target="_blank" rel="noopener noreferrer">
          Politica de confidențialitate
        </a>
        .
      </span>
    </label>
  );
}
