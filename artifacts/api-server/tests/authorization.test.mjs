import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getAuthenticatedUserId,
  hasStaffPermission,
  isStaffActive,
  staffRolePolicies,
} from "../src/middlewares/authorization.ts";

const roles = ["viewer", "sales", "inventory", "manager", "owner"];

test("unauthenticated and malformed identities have no authenticated user id", () => {
  assert.equal(getAuthenticatedUserId(undefined), undefined);
  assert.equal(getAuthenticatedUserId(null), undefined);
  assert.equal(getAuthenticatedUserId({ userId: 42 }), undefined);
  assert.equal(getAuthenticatedUserId({ sessionClaims: { userId: "clerk-user" } }), "clerk-user");
  assert.equal(getAuthenticatedUserId({ userId: "fallback-user" }), "fallback-user");
});

test("an inactive staff profile is never considered active", () => {
  for (const status of [undefined, null, "inactive", "pending", "disabled", "ACTIVE"]) {
    assert.equal(isStaffActive(status), false, `status ${String(status)} must be rejected`);
  }
  assert.equal(isStaffActive("active"), true);
});

test("read access is available to every active staff role while writes follow role policy", () => {
  const matrix = {
    owner: { viewer: false, sales: false, inventory: false, manager: false, owner: true },
    manager: { viewer: false, sales: false, inventory: false, manager: true, owner: true },
    inventory: { viewer: false, sales: false, inventory: true, manager: true, owner: true },
    sales: { viewer: false, sales: true, inventory: false, manager: true, owner: true },
  };

  for (const role of roles) {
    assert.equal(hasStaffPermission([role], role, roles), true, `${role} should have protected read access`);
    for (const [capability, policy] of Object.entries(staffRolePolicies)) {
      assert.equal(
        hasStaffPermission([role], role, policy),
        matrix[capability][role],
        `${role} permission for ${capability} operations`,
      );
    }
  }
});

test("multi-role staff receive the union of grants and owners retain owner access", () => {
  assert.equal(hasStaffPermission(["sales", "inventory"], "sales", staffRolePolicies.inventory), true);
  assert.equal(hasStaffPermission(["sales", "inventory"], "sales", staffRolePolicies.manager), false);
  assert.equal(hasStaffPermission(["owner"], "viewer", staffRolePolicies.owner), true);
  assert.equal(hasStaffPermission([], "manager", staffRolePolicies.manager), true, "legacy empty grants use the role");
  assert.equal(hasStaffPermission(undefined, undefined, staffRolePolicies.manager), false);
});

test("the authentication middleware returns 401 before profile lookup when identity is missing", async () => {
  const source = await readFile(new URL("../src/middlewares/auth.ts", import.meta.url), "utf8");
  assert.match(source, /const userId = getAuthenticatedUserId\(auth\)/);
  assert.match(source, /if \(!userId\)\s*\{\s*res\.status\(401\)\.json\(\{ error: "Unauthorized" \}\);\s*return;/);
  assert.match(source, /if \(!isStaffActive\(req\.staff\.status\)\)\s*\{\s*res\.status\(403\)/);
});

test("product, inventory, order, expense, team, and audit routes keep their intended guards", async () => {
  const route = async (file) =>
    readFile(new URL(`../src/routes/${file}.ts`, import.meta.url), "utf8");
  const [products, inventory, orders, expenses, staff, audit] = await Promise.all([
    route("products"), route("inventory"), route("orders"),
    route("expenses"), route("staff"), route("audit"),
  ]);

  const protectedRead = /router\.(?:get|use)\([^;]*requireAuth/;
  for (const [name, source] of Object.entries({ products, inventory, orders, expenses, staff, audit })) {
    assert.match(source, protectedRead, `${name} routes must require an authenticated active staff profile`);
  }

  assert.match(products, /router\.post\("\/products",\s*requireAuth,\s*requireManager/);
  assert.match(products, /router\.patch\("\/products\/:id",\s*requireAuth,\s*requireManager/);
  assert.match(inventory, /router\.post\("\/inventory\/movements",\s*requireInventory/);
  assert.match(inventory, /router\.delete\("\/inventory\/movements\/:id",\s*requireManager/);
  assert.match(inventory, /parsed\.data\.type === "adjustment" && req\.staff\?\.role !== "owner"/);
  assert.match(orders, /router\.post\("\/orders",\s*requireSales/);
  assert.match(orders, /router\.patch\("\/orders\/:id\/status",\s*requireManager/);
  assert.match(expenses, /router\.post\("\/expenses",\s*requireManager/);
  assert.match(staff, /router\.(?:get|post|patch)\("[^"]+",\s*requireOwner/);
  assert.match(audit, /router\.get\("\/audit",\s*requireManager/);
});
