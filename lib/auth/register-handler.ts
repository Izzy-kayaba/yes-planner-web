import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

const registrationSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  phoneNumber: z.string().trim(),
  password: z.string().min(8).max(128),
  role: z.string(),
});

type Registration = z.infer<typeof registrationSchema>;

type RegistrationDependencies = {
  ensureIndexes(): Promise<void>;
  isAllowedRole(role: string): boolean;
  findUser(query: { email: string } | { phoneNumber: string }): Promise<unknown>;
  signUp(input: {
    email: string;
    password: string;
    name: string;
    headers: Headers;
  }): Promise<Response>;
  updateUser(email: string, details: Omit<Registration, "email" | "password">): Promise<void>;
  reportError(error: unknown): void;
};

function json(message: string, status: number) {
  return Response.json({ message }, { status });
}

export function createRegistrationHandler(dependencies: RegistrationDependencies) {
  return async function register(request: Request) {
    const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !dependencies.isAllowedRole(parsed.data.role)) {
      return json("Please provide valid registration details.", 400);
    }

    const phone = parsePhoneNumberFromString(parsed.data.phoneNumber);
    if (!phone?.isValid()) return json("Enter a valid phone number.", 400);

    await dependencies.ensureIndexes();
    const email = parsed.data.email.toLowerCase();
    const phoneNumber = phone.number;

    if (await dependencies.findUser({ email })) {
      return json("An account already exists with this email. Sign in instead.", 409);
    }
    if (await dependencies.findUser({ phoneNumber })) {
      return json("Phone number already exists.", 409);
    }

    let response: Response;
    try {
      response = await dependencies.signUp({
        email,
        password: parsed.data.password,
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        headers: request.headers,
      });
    } catch (error) {
      dependencies.reportError(error);
      return json("Account creation is temporarily unavailable. Please try again.", 500);
    }

    if (!response.ok) return response;

    await dependencies.updateUser(email, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phoneNumber,
      role: parsed.data.role,
    });
    return response;
  };
}
