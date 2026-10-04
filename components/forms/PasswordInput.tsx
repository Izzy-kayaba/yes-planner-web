"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { text } = useLanguage();
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-input">
      <input {...props} type={visible ? "text" : "password"} />
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
