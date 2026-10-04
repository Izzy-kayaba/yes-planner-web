"use client";

import { Camera, Heart, Sparkles, Store, type LucideIcon } from "lucide-react";
import { getCountries, isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getBackend } from "@/lib/api/backend";
import type { RegisterInput } from "@/lib/api/contracts";
import { authClient } from "@/lib/auth-client";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { PasswordInput } from "@/components/forms/PasswordInput";

const roles = [
  { value: "Couple", icon: Heart },
  { value: "Planner", icon: Sparkles },
  { value: "Vendor", icon: Store },
] as const satisfies ReadonlyArray<{ value: AccountRole; icon: LucideIcon }>;

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const registrationSchema = loginSchema.extend({
  role: z.enum(["Couple", "Planner", "Vendor"]),
  firstName: z.string().trim().min(2, "Enter your first name."),
  lastName: z.string().trim().min(2, "Enter your last name."),
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => isValidPhoneNumber(value), "Enter a valid phone number."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[0-9]/, "Add at least one number.")
    .regex(/[^A-Za-z0-9]/, "Add at least one symbol."),
});

type AccountRole = "Couple" | "Planner" | "Vendor";

type AuthValues = {
  role: AccountRole;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { t, text } = useLanguage();
  const isRegister = mode === "register";
  const [defaultCountry, setDefaultCountry] = useState<Country>("ZA");
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    defaultValues: {
      role: "Couple",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });
  const selectedRole = watch("role");

  useEffect(() => {
    if (!isRegister) return;
    fetch("/api/v1/currency")
      .then((response) => response.json())
      .then((value: { country?: string | null }) => {
        if (value.country && getCountries().includes(value.country as Country)) {
          setDefaultCountry(value.country as Country);
        }
      })
      .catch(() => setDefaultCountry("ZA"));
  }, [isRegister]);

  async function submit(values: AuthValues) {
    // Zod remains the single definition of valid input while React Hook Form handles field state.
    const result = (isRegister ? registrationSchema : loginSchema).safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AuthValues;
        if (field) setError(field, { type: "validate", message: issue.message });
      });
      toast.error(text("Please check the highlighted details."));
      return;
    }

    try {
      if (isRegister) {
        const registration = result.data as RegisterInput;
        await getBackend().register({
          ...registration,
          phoneNumber: parsePhoneNumber(registration.phoneNumber).number,
        });
      } else await getBackend().login(result.data);
      toast.success(text(isRegister ? "Your workspace is ready." : "Welcome back."));
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Authentication failed."));
    }
  }

  async function socialSignIn(provider: "google" | "instagram") {
    if (isRegister) {
      document.cookie = `yes-pending-role=${selectedRole}; Path=/; Max-Age=600; SameSite=Lax`;
    }
    const result = await authClient.signIn.social({
      provider,
      callbackURL: "/api/v1/auth/complete",
    });
    if (result?.error) toast.error(result.error.message ?? text("Authentication failed."));
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      {isRegister && (
        <fieldset className="grid gap-2 border-0 p-0">
          <legend>
            <FieldLabel required>{text("Account type")}</FieldLabel>
          </legend>
          <div className="role-picker">
            {roles.map(({ value, icon: Icon }) => (
              <button
                aria-pressed={selectedRole === value}
                className={cn(selectedRole === value && "selected")}
                type="button"
                key={value}
                onClick={() => setValue("role", value, { shouldValidate: true })}
              >
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                {text(value)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {isRegister && (
        <div className="form-row">
          <label>
            <FieldLabel required>{t("auth.firstName")}</FieldLabel>
            <input
              {...register("firstName")}
              id="auth-first-name"
              name="firstName"
              aria-invalid={Boolean(errors.firstName)}
              placeholder="Alex"
              autoComplete="given-name"
              required
            />
            {errors.firstName && (
              <small className="form-error">{text(errors.firstName.message ?? "")}</small>
            )}
          </label>
          <label>
            <FieldLabel required>{t("auth.lastName")}</FieldLabel>
            <input
              {...register("lastName")}
              id="auth-last-name"
              name="lastName"
              aria-invalid={Boolean(errors.lastName)}
              placeholder="Morgan"
              autoComplete="family-name"
              required
            />
            {errors.lastName && (
              <small className="form-error">{text(errors.lastName.message ?? "")}</small>
            )}
          </label>
        </div>
      )}

      <label>
        <FieldLabel required>{t("auth.email")}</FieldLabel>
        <input
          {...register("email")}
          id="auth-email"
          name="email"
          aria-invalid={Boolean(errors.email)}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        {errors.email && <small className="form-error">{text(errors.email.message ?? "")}</small>}
      </label>

      {isRegister && (
        <label>
          <FieldLabel required>{t("auth.phone")}</FieldLabel>
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field }) => (
              <PhoneInput
                {...field}
                id="auth-phone-number"
                name="phoneNumber"
                className="phone-input"
                defaultCountry={defaultCountry}
                international
                countryCallingCodeEditable={false}
                aria-invalid={Boolean(errors.phoneNumber)}
                autoComplete="tel"
                required
                onChange={(value) => field.onChange(value ?? "")}
              />
            )}
          />
          {errors.phoneNumber && (
            <small className="form-error">{text(errors.phoneNumber.message ?? "")}</small>
          )}
        </label>
      )}

      <label>
        <span className="label-row">
          <FieldLabel required>{t("auth.password")}</FieldLabel>
          {!isRegister && <Link href="/forgot-password">{t("auth.forgot")}</Link>}
        </span>
        <PasswordInput
          {...register("password")}
          id="auth-password"
          name="password"
          aria-invalid={Boolean(errors.password)}
          placeholder="••••••••••••"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
        />
        {errors.password && (
          <small className="form-error">{text(errors.password.message ?? "")}</small>
        )}
      </label>

      {isRegister && (
        <p className="form-hint">{text("Use at least 8 characters with a number and a symbol.")}</p>
      )}

      <Button disabled={isSubmitting} fullWidth type="submit">
        {isRegister ? t("auth.create") : t("auth.continue")}
        <span aria-hidden="true">→</span>
      </Button>

      <div className="form-divider">
        <span>{text("or continue with")}</span>
      </div>
      <div className="social-row">
        <Button type="button" variant="secondary" onClick={() => void socialSignIn("google")}>
          <span className="font-bold text-[#EA4335]" aria-hidden="true">
            G
          </span>
          Google
        </Button>
        <Button type="button" variant="secondary" onClick={() => void socialSignIn("instagram")}>
          <Camera className="text-[#C13584]" size={17} aria-hidden="true" />
          Instagram
        </Button>
      </div>

      <p className="auth-switch">
        {isRegister ? t("auth.account") : t("auth.new")}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? t("auth.signIn") : t("auth.createAccount")}
        </Link>
      </p>
    </form>
  );
}
