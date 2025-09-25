import React from "react";
import BaseModal from "./BaseModal";
import CategoryForm from "./CategoryForm";

type Values = { name: string; description: string };

export default function CategoryModal({
  title,
  defaultValues,
  onClose,
  onSubmit,
  size = "md",
}: {
  title: string;
  defaultValues?: Partial<Values>;
  onClose: () => void;
  onSubmit: (payload: Values) => void | Promise<void>;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <BaseModal title={title} onClose={onClose} size={size}>
      <CategoryForm
        defaultValues={defaultValues}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </BaseModal>
  );
}
