"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { YesSelect } from "@/components/ui/YesSelect";
import { FieldLabel } from "@/components/forms/FieldLabel";
import PhoneInput from "react-phone-number-input";
import Link from "next/link";

export type EntityFormValue = string | number | boolean;

export type EntityField = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "number" | "date" | "time" | "textarea" | "select" | "checkbox";
  options?: Array<string | { value: string; label: string }>;
  emptyMessage?: string;
  setupHref?: string;
  setupLabel?: string;
};

function TelephoneField({
  field,
  initialValue,
  placeholder,
}: {
  field: EntityField;
  initialValue: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <PhoneInput
      className="phone-input"
      countryCallingCodeEditable={false}
      defaultCountry="ZA"
      id={field.name}
      international
      name={field.name}
      onChange={(nextValue) => setValue(nextValue ?? "")}
      placeholder={placeholder}
      required={field.required}
      value={value}
    />
  );
}

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
  const { text } = useLanguage();
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
        return [
          field.name,
          field.type === "number"
            ? Number(raw)
            : field.type === "checkbox"
              ? data.has(field.name)
              : raw,
        ];
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
          <label className="grid gap-1.5 text-sm font-bold" key={field.name}>
            {field.type === "checkbox" ? (
              <span className="inline-flex items-center gap-2">
                <input
                  className="size-5"
                  defaultChecked={Boolean(defaults[field.name])}
                  id={field.name}
                  name={field.name}
                  type="checkbox"
                />
                <FieldLabel required={field.required}>{text(field.label)}</FieldLabel>
              </span>
            ) : (
              <>
                <FieldLabel required={field.required}>{text(field.label)}</FieldLabel>
                {field.type === "tel" ? (
                  <TelephoneField
                    field={field}
                    initialValue={String(defaults[field.name] ?? "")}
                    placeholder={field.placeholder ? text(field.placeholder) : undefined}
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    className="min-h-28 p-3 text-sm"
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    defaultValue={String(defaults[field.name] ?? "")}
                    placeholder={field.placeholder ? text(field.placeholder) : undefined}
                  />
                ) : field.type === "select" ? (
                  <>
                    <YesSelect
                      ariaLabel={text(field.label)}
                      defaultValue={String(defaults[field.name] ?? "")}
                      disabled={!field.options?.length}
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      placeholder={text("Select an option")}
                      options={(field.options ?? []).map((option) =>
                        typeof option === "string"
                          ? { value: option, label: text(option) }
                          : { value: option.value, label: text(option.label) },
                      )}
                    />
                    {!field.options?.length && field.setupHref && (
                      <label className="select-setup-hint">
                        <span>{text(field.emptyMessage ?? "This list is empty.")}</span>{" "}
                        <Link href={field.setupHref}>
                          {text(field.setupLabel ?? "Set it up first")}
                        </Link>
                      </label>
                    )}
                  </>
                ) : (
                  <input
                    className="h-11 px-3 text-sm"
                    id={field.name}
                    name={field.name}
                    type={field.type ?? "text"}
                    required={field.required}
                    defaultValue={String(defaults[field.name] ?? "")}
                    placeholder={field.placeholder ? text(field.placeholder) : undefined}
                  />
                )}
              </>
            )}
          </label>
        ))}
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {text("Cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {text(saving ? "Saving…" : "Save changes")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
