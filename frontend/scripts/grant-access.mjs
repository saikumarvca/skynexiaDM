/**
 * Grants dashboard permissions to a team member by attaching a role.
 *
 * Fixes the "Welcome … here are the modules you can currently access" screen
 * that only shows Help: that happens when the login's team member has no role
 * (or no team member record at all), so its permission list is empty.
 *
 * What it does, for the given email:
 *   1. Finds the login User (users collection) and the TeamMember (teammembers).
 *      Creates the TeamMember from the User if it is missing.
 *   2. Finds the TeamRole by name, creating it with GRANT_PERMISSIONS if missing.
 *      If the role exists but lacks any of GRANT_PERMISSIONS, they are added.
 *   3. Sets roleId/roleName on the TeamMember, links userId, marks it Active.
 *   4. Prints how many review allocations point at that member.
 *
 * Usage (run ON the server that hosts the app, from the frontend directory):
 *
 *   GRANT_EMAIL="person@example.com" node scripts/grant-access.mjs
 *
 * Optional env:
 *   MONGODB_URI        defaults to .env.local / .env in cwd, then localhost/dm
 *   GRANT_ROLE         role name to attach (default: "Reviewer")
 *   GRANT_PERMISSIONS  comma-separated (default: view_reviews,work_assigned_reviews)
 *                      add view_dashboard to also unlock the dashboard home
 *   DRY_RUN=1          print what would change without writing
 *
 * Never commit real production URIs to git.
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const PERMISSION_LIST = [
  "view_dashboard",
  "view_clients",
  "view_campaigns",
  "view_content",
  "view_seo",
  "view_leads",
  "view_tasks",
  "work_assigned_tasks",
  "view_reviews",
  "work_assigned_reviews",
  "manage_clients",
  "manage_campaigns",
  "manage_content",
  "manage_seo",
  "manage_leads",
  "manage_tasks",
  "manage_reviews",
  "manage_team",
  "manage_roles",
  "view_analytics",
  "assign_reviews",
  "assign_tasks",
  "manage_settings",
];

function readEnvFile(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    const out = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function resolveMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  for (const f of [".env.local", ".env"]) {
    const env = readEnvFile(path.resolve(process.cwd(), f));
    if (env.MONGODB_URI) return env.MONGODB_URI;
  }
  return "mongodb://localhost:27017/dm";
}

function maskUri(uri) {
  return uri.replace(/(:\/\/[^:/@]+:)[^@]+@/, "$1***@");
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MONGODB_URI = resolveMongoUri();
const email = (process.env.GRANT_EMAIL || "").trim().toLowerCase();
const roleName = (process.env.GRANT_ROLE || "Reviewer").trim();
const requestedPerms = (process.env.GRANT_PERMISSIONS || "view_reviews,work_assigned_reviews")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);
const dryRun = process.env.DRY_RUN === "1";

if (!email) {
  console.error("GRANT_EMAIL is required, e.g. GRANT_EMAIL=person@example.com");
  process.exit(1);
}
const badPerms = requestedPerms.filter((p) => !PERMISSION_LIST.includes(p));
if (badPerms.length) {
  console.error(`Unknown permission(s): ${badPerms.join(", ")}`);
  console.error(`Valid: ${PERMISSION_LIST.join(", ")}`);
  process.exit(1);
}

console.log(`Mongo:  ${maskUri(MONGODB_URI)}`);
console.log(`Email:  ${email}`);
console.log(`Role:   ${roleName}`);
console.log(`Perms:  ${requestedPerms.join(", ")}`);
if (dryRun) console.log("DRY RUN: no changes will be written");
console.log("");

await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
const db = mongoose.connection.db;
const users = db.collection("users");
const members = db.collection("teammembers");
const roles = db.collection("teamroles");
const allocations = db.collection("reviewallocations");

try {
  const emailRx = new RegExp(`^${escapeRegex(email)}$`, "i");

  // 1. Login user
  const user = await users.findOne({ email: emailRx });
  if (user) {
    console.log(`Login user: ${user.name} (${user._id}) role=${user.role} active=${user.isActive}`);
    if (user.role === "ADMIN") {
      console.log("  This login is an app ADMIN and already has every permission; nothing to grant.");
    }
  } else {
    console.log("Login user: none found for this email.");
    console.log("  The member will get the role, but they cannot sign in until a password is set");
    console.log("  (Team -> Members -> edit -> set password, or scripts/seed-user.mjs).");
  }

  // 2. Team member (prefer userId link, then email)
  const memberQuery = { isDeleted: { $ne: true } };
  memberQuery.$or = user
    ? [{ userId: String(user._id) }, { email: emailRx }]
    : [{ email: emailRx }];
  let member = await members.findOne(memberQuery);

  if (!member) {
    if (!user) {
      console.error("\nNo team member and no login user for this email. Nothing to attach a role to.");
      console.error("Create the member first (Team -> Members -> Add) and run again.");
      process.exitCode = 1;
    } else {
      console.log("Team member: none found; will create one from the login user.");
      const now = new Date();
      const doc = {
        name: user.name,
        email,
        userId: String(user._id),
        agencyId: user.agencyId ?? null,
        memberScopeType: "MAIN",
        isPartnerEmployee: false,
        accountType: "MAIN_EMPLOYEE",
        partnerAgencyId: null,
        assignedClientIds: [],
        assignedClientNamesSnapshot: [],
        status: "Active",
        joinedAt: now,
        isDeleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      if (!dryRun) {
        const res = await members.insertOne(doc);
        member = { ...doc, _id: res.insertedId };
        console.log(`  Created team member ${member._id}`);
      } else {
        member = { ...doc, _id: "(new)" };
      }
    }
  } else {
    console.log(
      `Team member: ${member.name} (${member._id}) role=${member.roleName ?? "none"} status=${member.status} userId=${member.userId ?? "none"}`,
    );
  }

  if (member) {
    // 3. Role
    let role = await roles.findOne({
      roleName: new RegExp(`^${escapeRegex(roleName)}$`, "i"),
      isDeleted: { $ne: true },
    });

    if (!role) {
      console.log(`Role: "${roleName}" not found; will create it with the permissions above.`);
      const now = new Date();
      const doc = {
        roleName,
        description: "Created by scripts/grant-access.mjs",
        permissions: requestedPerms,
        agencyId: null,
        isDeleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      if (!dryRun) {
        const res = await roles.insertOne(doc);
        role = { ...doc, _id: res.insertedId };
        console.log(`  Created role ${role._id}`);
      } else {
        role = { ...doc, _id: "(new)" };
      }
    } else {
      const have = Array.isArray(role.permissions) ? role.permissions : [];
      const missing = requestedPerms.filter((p) => !have.includes(p));
      console.log(`Role: "${role.roleName}" (${role._id}) has [${have.join(", ")}]`);
      if (missing.length) {
        const others = await members.countDocuments({
          roleId: role._id,
          isDeleted: { $ne: true },
          _id: { $ne: member._id },
        });
        console.log(
          `  Adding missing permission(s) [${missing.join(", ")}] to this role` +
            (others ? ` (also affects ${others} other member(s) with this role)` : ""),
        );
        if (!dryRun) {
          await roles.updateOne(
            { _id: role._id },
            { $addToSet: { permissions: { $each: missing } }, $set: { updatedAt: new Date() } },
          );
        }
      }
    }

    // 4. Attach role + link login
    const set = {
      roleId: role._id,
      roleName: role.roleName,
      status: "Active",
      isDeleted: false,
      deletedAt: null,
      updatedAt: new Date(),
    };
    if (user && !member.userId) set.userId = String(user._id);
    console.log(
      `Member update: roleId=${role._id} roleName="${role.roleName}" status=Active` +
        (set.userId ? ` userId=${set.userId}` : ""),
    );
    if (!dryRun) {
      await members.updateOne({ _id: member._id }, { $set: set });
    }

    // 5. Review allocations pointing at this member
    if (member._id !== "(new)") {
      const memberId = String(member._id);
      const byStatus = await allocations
        .aggregate([
          { $match: { assignedToUserId: memberId } },
          { $group: { _id: "$allocationStatus", n: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])
        .toArray();
      const total = byStatus.reduce((s, r) => s + r.n, 0);
      console.log(`\nReview allocations assigned to this member: ${total}`);
      for (const r of byStatus) console.log(`  ${r._id}: ${r.n}`);

      // Other member records for the same person (duplicates) that hold allocations
      const twins = await members
        .find({ _id: { $ne: member._id }, $or: [{ email: emailRx }, { name: member.name }] })
        .project({ name: 1, email: 1, isDeleted: 1 })
        .toArray();
      for (const t of twins) {
        const n = await allocations.countDocuments({ assignedToUserId: String(t._id) });
        if (n) {
          console.log(
            `  Note: ${n} allocation(s) are assigned to another member record "${t.name}" <${t.email}> (${t._id}${t.isDeleted ? ", deleted" : ""}). ` +
              `Re-assign them to ${memberId} in Reviews -> Review Allocations if they belong to this person.`,
          );
        }
      }
    }

    console.log(
      dryRun
        ? "\nDry run complete."
        : "\nDone. Ask the member to log out and back in, then open Reviews -> My Assigned Reviews.",
    );
  }
} finally {
  await mongoose.disconnect();
}
