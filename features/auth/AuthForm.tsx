"use client";

import { Building2, Camera, Heart, Store, type LucideIcon } from "lucide-react";
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
import { YesSelect } from "@/components/ui/YesSelect";
import { apiRequest } from "@/lib/api/client";

const accountTypes = [
  { value: "Couple", label: "Couple", icon: Heart },
  { value: "Vendor", label: "Vendor / Business", icon: Store },
  { value: "Venue", label: "Venue / Organisation", icon: Building2 },
] as const satisfies ReadonlyArray<{
  value: AccountType;
  label: string;
  icon: LucideIcon;
}>;

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const registrationSchema = loginSchema.extend({
  accountType: z.enum(["Couple", "Venue", "Vendor"]),
  businessProfileId: z.string().optional(),
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

type AccountType = "Couple" | "Venue" | "Vendor";

type AuthValues = {
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  businessProfileId?: string;
};

type ClaimableProfile = {
  id: string;
  businessName: string;
  services: string[];
  serviceArea: string;
};

export function AuthForm({
  mode,
  initialNotice,
}: {
  mode: "login" | "register";
  initialNotice?: "account-exists";
}) {
  const router = useRouter();
  const { t, text } = useLanguage();
  const isRegister = mode === "register";
  const [defaultCountry, setDefaultCountry] = useState<Country>("ZA");
  const [claimableProfiles, setClaimableProfiles] = useState<ClaimableProfile[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
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
      accountType: "Couple",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      businessProfileId: "",
    },
  });
  const selectedAccountType = watch("accountType");
  const selectedBusinessProfileId = watch("businessProfileId");

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

  useEffect(() => {
    if (
      !isRegister ||
      selectedAccountType === "Couple" ||
      (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") !== "api"
    ) {
      setClaimableProfiles([]);
      return;
    }
    const controller = new AbortController();
    setClaimsLoading(true);
    fetch("/api/v1/vendor-profile/claimable", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Business listings could not be loaded.");
        return (await response.json()) as ClaimableProfile[];
      })
      .then(setClaimableProfiles)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error(
          text(error instanceof Error ? error.message : "Business listings could not be loaded."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setClaimsLoading(false);
      });
    return () => controller.abort();
  }, [isRegister, selectedAccountType, text]);

  useEffect(() => {
    if (initialNotice !== "account-exists") return;
    void authClient.signOut();
    toast.error(text("An account already exists with this email. Sign in instead."));
  }, [initialNotice, text]);

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
        const registered = await getBackend().register({
          ...registration,
          phoneNumber: parsePhoneNumber(registration.phoneNumber).number,
        });
        if (registration.businessProfileId && registered.userId) {
          try {
            await apiRequest("/api/v1/vendor-profile/claim", {
              method: "POST",
              body: JSON.stringify({ profileId: registration.businessProfileId }),
            });
          } catch (claimError) {
            toast.error(
              `Your account was created, but the business claim was not submitted: ${
                claimError instanceof Error ? claimError.message : "Please sign in and try again."
              }`,
            );
            router.push("/dashboard");
            return;
          }
        }
      } else await getBackend().login(result.data);
      toast.success(text(isRegister ? "Your workspace is ready." : "Welcome back."));
      router.push("/dashboard");
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Authentication failed."));
    }
  }

  async function socialSignIn(provider: "google" | "instagram") {
    if (isRegister) {
      document.cookie = `yes-pending-account-type=${selectedAccountType}; Path=/; Max-Age=600; SameSite=Lax`;
      if (selectedBusinessProfileId) {
        document.cookie = `yes-pending-profile-claim=${selectedBusinessProfileId}; Path=/; Max-Age=600; SameSite=Lax`;
      } else {
        document.cookie = "yes-pending-profile-claim=; Path=/; Max-Age=0; SameSite=Lax";
      }
      document.cookie = `yes-auth-intent=register:${provider}:${Date.now()}; Path=/; Max-Age=600; SameSite=Lax`;
    }
    const result = await authClient.signIn.social({
      provider,
      callbackURL: "/api/v1/auth/complete",
    });
    if (result?.error) {
      toast.error(
        provider === "google"
          ? text(
              "If you already created an account with this email, sign in with your password, verify your email, then connect Google from Settings → Security.",
            )
          : text(result.error.message ?? "Authentication failed."),
      );
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      {isRegister && (
        <fieldset className="grid gap-2 border-0 p-0">
          <legend>
            <FieldLabel required>{text("Account type")}</FieldLabel>
          </legend>
          <div className="role-picker">
            {accountTypes.map(({ value, label, icon: Icon }) => (
              <button
                aria-pressed={selectedAccountType === value}
                className={cn(selectedAccountType === value && "selected")}
                type="button"
                key={value}
                onClick={() => setValue("accountType", value, { shouldValidate: true })}
              >
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                {text(label)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {isRegister && selectedAccountType !== "Couple" && (
        <label>
          <FieldLabel>{text("Claim an existing business listing (optional)")}</FieldLabel>
          <YesSelect
            ariaLabel={text("Business listing to claim")}
            value={selectedBusinessProfileId ?? ""}
            options={[
              {
                value: "",
                label: claimsLoading
                  ? text("Loading listings…")
                  : text("Create a new business profile"),
              },
              ...claimableProfiles.map((profile) => ({
                value: profile.id,
                label: `${profile.businessName}${profile.serviceArea ? ` · ${profile.serviceArea}` : ""}`,
              })),
            ]}
            disabled={claimsLoading}
            onChange={(value) => setValue("businessProfileId", value)}
          />
          <small className="form-hint">
            {text(
              "If you claim a listing, an administrator must verify it. Your account creation will still complete if a claim needs review.",
            )}
          </small>
        </label>
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
