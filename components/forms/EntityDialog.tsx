"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type EntityFormValue = string | number;

export type EntityField = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "number" | "date" | "time" | "textarea" | "select";
  options?: string[];
};

export function EntityDialog({
  open,
  title,
  description,
  fields,
  initialValues = {},
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  description?: string;
  fields: EntityField[];
  initialValues?: object;
  onClose: () => void;
  onSave: (values: Record<string, EntityFormValue>) => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const defaults = initialValues as Record<string, EntityFormValue>;

  useEffect(() => {
    if (open) setFormKey((value) => value + 1);
  }, [open, initialValues]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      fields.map((field) => {
        const raw = String(data.get(field.name) ?? "");
        return [field.name, field.type === "number" ? Number(raw) : raw];
      }),
    );
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <form className="grid gap-4" key={formKey} onSubmit={submit}>
        {fields.map((field) => (
          <label className="grid gap-1.5 text-xs font-bold" key={field.name}>
            {field.label}
            {field.type === "textarea" ? (
              <textarea
                className="min-h-28 p-3 text-sm"
                name={field.name}
                required={field.required}
                defaultValue={defaults[field.name]}
                placeholder={field.placeholder}
              />
            ) : field.type === "select" ? (
              <select
                className="h-11 px-3 text-sm"
                name={field.name}
                required={field.required}
                defaultValue={defaults[field.name] ?? ""}
              >
                <option value="" disabled>
                  Select an option
                </option>
                {field.options?.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="h-11 px-3 text-sm"
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                defaultValue={defaults[field.name]}
                placeholder={field.placeholder}
              />
            )}
          </label>
        ))}
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
