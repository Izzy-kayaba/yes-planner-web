import assert from "node:assert/strict";
import test from "node:test";
import { createRegistrationHandler } from "../../lib/auth/register-handler.ts";

const validBody = {
  firstName: "Sarah",
  lastName: "Mokoena",
  email: "SARAH@example.com",
  phoneNumber: "+27821234567",
  password: "Password!2026",
  accountType: "Couple",
};

function setup(overrides = {}) {
  const calls = { updates: [], signUps: 0, errors: 0 };
  const dependencies = {
    ensureIndexes: async () => {},
    isAllowedRole: (accountType) => ["Couple", "Venue", "Vendor"].includes(accountType),
    findUser: async () => null,
    signUp: async () => {
      calls.signUps += 1;
      return Response.json({ user: { id: "user-1" } });
    },
    updateUser: async (...details) => calls.updates.push(details),
    reportError: () => {
      calls.errors += 1;
    },
    ...overrides,
  };
  return { handler: createRegistrationHandler(dependencies), calls };
}

function request(body = validBody) {
  return new Request("http://localhost/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("rejects malformed registration details", async () => {
  const { handler } = setup();
  const response = await handler(request({ ...validBody, email: "invalid" }));
  assert.equal(response.status, 400);
});

test("rejects account types that cannot self-register", async () => {
  const { handler } = setup();
  const response = await handler(request({ ...validBody, accountType: "SystemAdmin" }));
  assert.equal(response.status, 400);
});

test("rejects invalid phone numbers", async () => {
  const { handler } = setup();
  const response = await handler(request({ ...validBody, phoneNumber: "123" }));
  assert.equal(response.status, 400);
});

test("returns a clear response for an existing email", async () => {
  const { handler } = setup({
    findUser: async (query) => ("email" in query ? { id: "existing" } : null),
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    message: "An account already exists with this email. Sign in instead.",
  });
});

test("rejects an existing normalized phone number", async () => {
  const { handler } = setup({
    findUser: async (query) => ("phoneNumber" in query ? { id: "existing" } : null),
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
});

test("preserves Better Auth error responses", async () => {
  const { handler } = setup({
    signUp: async () => Response.json({ message: "Rejected" }, { status: 422 }),
  });
  const response = await handler(request());
  assert.equal(response.status, 422);
});

test("returns a controlled response when Better Auth throws", async () => {
  const { handler, calls } = setup({
    signUp: async () => {
      throw new Error("database unavailable");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 500);
  assert.equal(calls.errors, 1);
});

test("normalizes identity data and completes a successful registration", async () => {
  const { handler, calls } = setup();
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(calls.signUps, 1);
  assert.equal(calls.updates[0][0], "sarah@example.com");
  assert.equal(calls.updates[0][1].phoneNumber, "+27821234567");
  assert.equal(calls.updates[0][1].accountType, "Couple");
  assert.equal(calls.updates[0][1].role, "Couple");
});

test("accepts venue as a primary account type", async () => {
  const { handler, calls } = setup();
  const response = await handler(request({ ...validBody, accountType: "Venue" }));
  assert.equal(response.status, 200);
  assert.equal(calls.updates[0][1].accountType, "Venue");
});

test("keeps the old role field readable during migration", async () => {
  const { handler, calls } = setup();
  const { accountType, ...legacyBody } = validBody;
  const response = await handler(request({ ...legacyBody, role: "Vendor" }));
  assert.equal(response.status, 200);
  assert.equal(calls.updates[0][1].accountType, "Vendor");
});
