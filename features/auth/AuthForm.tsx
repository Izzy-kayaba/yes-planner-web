"use client";

import { Heart, Sparkles, Store, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getBackend } from "@/lib/api/backend";
import type { RegisterInput } from "@/lib/api/contracts";

const roles = [
  { value: "Couple", icon: Heart },
  { value: "Planner", icon: Sparkles },
  { value: "Vendor", icon: Store },
] as const satisfies ReadonlyArray<{ value: AccountRole; icon: LucideIcon }>;

const loginSchema = z.object({
  phoneNumber: z.string().trim().min(8, "Enter a valid phone number."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const registrationSchema = loginSchema.extend({
  role: z.enum(["Couple", "Planner", "Vendor"]),
  firstName: z.string().trim().min(2, "Enter your first name."),
  lastName: z.string().trim().min(2, "Enter your last name."),
  email: z.string().trim().email("Enter a valid email address."),
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
  const { t } = useLanguage();
  const isRegister = mode === "register";
  const {
    register,
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

  async function submit(values: AuthValues) {
    // Zod remains the single definition of valid input while React Hook Form handles field state.
    const result = (isRegister ? registrationSchema : loginSchema).safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AuthValues;
        if (field) setError(field, { type: "validate", message: issue.message });
      });
      toast.error("Please check the highlighted details.");
      return;
    }

    try {
      if (isRegister) await getBackend().register(result.data as RegisterInput);
      else await getBackend().login(result.data);
      toast.success(isRegister ? "Your workspace is ready." : "Welcome back, Amara.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      {isRegister && (
        <div className="role-picker" aria-label="Account type">
          {roles.map(({ value, icon: Icon }) => (
            <button
              aria-pressed={selectedRole === value}
              className={cn(selectedRole === value && "selected")}
              type="button"
              key={value}
              onClick={() => setValue("role", value, { shouldValidate: true })}
            >
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              {value}
            </button>
          ))}
        </div>
      )}

      {isRegister && (
        <div className="form-row">
          <label>
            {t("auth.firstName")}
            <input
              {...register("firstName")}
              aria-invalid={Boolean(errors.firstName)}
              placeholder="Amara"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <small className="text-vow-wine">{errors.firstName.message}</small>
            )}
          </label>
          <label>
            {t("auth.lastName")}
            <input
              {...register("lastName")}
              aria-invalid={Boolean(errors.lastName)}
              placeholder="Mokoena"
              autoComplete="family-name"
            />
            {errors.lastName && <small className="text-vow-wine">{errors.lastName.message}</small>}
          </label>
        </div>
      )}

      {isRegister && (
        <label>
          {t("auth.email")}
          <input
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <small className="text-vow-wine">{errors.email.message}</small>}
        </label>
      )}

      <label>
        {t("auth.phone")}
        <input
          {...register("phoneNumber")}
          aria-invalid={Boolean(errors.phoneNumber)}
          type="tel"
          placeholder="+27 82 123 4567"
          autoComplete="tel"
        />
        {errors.phoneNumber && (
          <small className="text-vow-wine">{errors.phoneNumber.message}</small>
        )}
      </label>

      <label>
        <span className="label-row">
          {t("auth.password")}
          {!isRegister && <Link href="#">{t("auth.forgot")}</Link>}
        </span>
        <input
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
          type="password"
          placeholder="••••••••••••"
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
        {errors.password && <small className="text-vow-wine">{errors.password.message}</small>}
      </label>

      {isRegister && (
        <p className="form-hint">Use at least 8 characters with a number and a symbol.</p>
      )}

      <Button disabled={isSubmitting} fullWidth type="submit">
        {isRegister ? t("auth.create") : t("auth.continue")}
        <span aria-hidden="true">→</span>
      </Button>

      <div className="form-divider">
        <span>or continue with</span>
      </div>
      <div className="social-row">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            toast.info("Google sign-in will be available when authentication is connected.")
          }
        >
          G&nbsp;&nbsp; Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            toast.info("Apple sign-in will be available when authentication is connected.")
          }
        >
          ⌘&nbsp;&nbsp; Apple
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
