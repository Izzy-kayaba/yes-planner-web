import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessRoute,
  canUseWorkspaceModule,
  isWorkspaceModule,
} from "../../lib/auth/permissions.ts";
import { offersWeddingPlanning, weddingPlanningService } from "../../lib/vendors/services.ts";
import { resolveWeddingAccessPolicy } from "../../lib/auth/wedding-access-policy.ts";

test("venues receive no workspace-management access, even for legacy full-manager records", () => {
  for (const module of [
    "guests",
    "budget",
    "tasks",
    "vendors",
    "timeline",
    "seating",
    "food-drinks",
    "documents",
    "bookings",
    "payments",
    "notes",
  ]) {
    assert.equal(canUseWorkspaceModule("Venue", module, "read", "FullManager"), false);
    assert.equal(canUseWorkspaceModule("Venue", module, "create", "FullManager"), false);
    assert.equal(canUseWorkspaceModule("Venue", module, "read", "Vendor"), false);
    assert.equal(canUseWorkspaceModule("Venue", module, "read"), false);
  }
});

test("venues can open assigned wedding briefs, but not planner or admin routes", () => {
  assert.equal(canAccessRoute("Venue", "/weddings/example"), true);
  assert.equal(canAccessRoute("Venue", "/weddings/example/tasks"), false);
  assert.equal(canAccessRoute("Venue", "/planner"), false);
  assert.equal(canAccessRoute("Venue", "/admin"), false);
});

test("planner eligibility requires the Wedding planning business service", () => {
  assert.equal(offersWeddingPlanning([weddingPlanningService]), true);
  assert.equal(offersWeddingPlanning(["Venue", "Catering"]), false);
  assert.equal(offersWeddingPlanning(undefined), false);
});

test("a limited venue collaboration does not grant full-manager access", () => {
  assert.equal(canUseWorkspaceModule("Venue", "guests", "update", "Vendor"), false);
  assert.equal(canUseWorkspaceModule("Venue", "guests", "update", "FullManager"), false);
});

test("couples and full-manager vendors have module access while limited vendors stay read-only", () => {
  for (const module of [
    "guests",
    "budget",
    "tasks",
    "vendors",
    "timeline",
    "seating",
    "food-drinks",
    "documents",
    "bookings",
    "payments",
    "notes",
  ]) {
    for (const action of ["read", "create", "update", "delete"]) {
      assert.equal(canUseWorkspaceModule("Couple", module, action, "Owner"), true);
      assert.equal(canUseWorkspaceModule("Vendor", module, action, "FullManager"), true);
    }
    assert.equal(
      canUseWorkspaceModule("Vendor", module, "read", "Vendor"),
      ["tasks", "vendors", "timeline", "documents", "bookings", "payments", "notes"].includes(
        module,
      ),
    );
    assert.equal(canUseWorkspaceModule("Vendor", module, "update", "Vendor"), false);
  }
});

test("recognizes only declared workspace collections", () => {
  assert.equal(isWorkspaceModule("guests"), true);
  assert.equal(isWorkspaceModule("payments"), true);
  assert.equal(isWorkspaceModule("users"), false);
  assert.equal(isWorkspaceModule(""), false);
});

test("wedding access is limited to the owner or the active matching collaborator", () => {
  const couple = { id: "couple-1", role: "Couple" };
  const owned = { ownerUserId: "couple-1", weddingKey: "wedding-1" };
  const ownAccess = resolveWeddingAccessPolicy(couple, "wedding-1", owned, null);
  assert.deepEqual(ownAccess, { ownerUserId: "couple-1", access: "Owner" });

  const collaborator = {
    userId: "vendor-1",
    weddingKey: "wedding-1",
    weddingOwnerUserId: "couple-1",
    status: "Active",
    access: "FullManager",
  };
  assert.deepEqual(
    resolveWeddingAccessPolicy({ id: "vendor-1", role: "Vendor" }, "wedding-1", null, collaborator),
    { ownerUserId: "couple-1", access: "FullManager" },
  );
  assert.equal(
    resolveWeddingAccessPolicy({ id: "vendor-2", role: "Vendor" }, "wedding-1", null, collaborator),
    null,
  );
  assert.equal(
    resolveWeddingAccessPolicy({ id: "vendor-1", role: "Vendor" }, "wedding-2", null, collaborator),
    null,
  );
  assert.equal(
    resolveWeddingAccessPolicy({ id: "vendor-1", role: "Vendor" }, "wedding-1", null, {
      ...collaborator,
      status: "Declined",
    }),
    null,
  );
});

test("venue collaborations never gain manager access from stale ownership records", () => {
  assert.deepEqual(
    resolveWeddingAccessPolicy({ id: "venue-1", role: "Venue" }, "wedding-1", null, {
      userId: "venue-1",
      weddingKey: "wedding-1",
      weddingOwnerUserId: "couple-1",
      status: "Active",
      access: "FullManager",
    }),
    { ownerUserId: "couple-1", access: "Vendor" },
  );
});
