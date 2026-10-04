"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { text } = useLanguage();
  const [visible, setVisible] = useState(false);
  const generatedId = `password-${useId().replaceAll(":", "")}`;
  const id = props.id ?? generatedId;
  const name = props.name ?? id;

  return (
    <span className="password-input">
      <input {...props} id={id} name={name} type={visible ? "text" : "password"} />
      <button
        aria-label={text(visible ? "Hide password" : "Show password")}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  );
}
