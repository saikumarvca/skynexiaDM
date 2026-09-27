/**
 * Seed the client-portal test database: two clients (A, B) with their own
 * reviews, events, updates and notifications, plus internal accounts.
 * Drops the database first so every run starts from the same state.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ACCOUNTS, FIXTURE_IDS as ID, PASSWORD, oid } from "./helpers.mjs";

export async function seedTestDatabase(uri) {
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;
  await db.dropDatabase();

  const hash = await bcrypt.hash(PASSWORD, 4);
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  await db.collection("clients").insertMany([
    {
      _id: oid(ID.clientA),
      name: "Alpha Dental",
      businessName: "Alpha Dental",
      brandName: "Alpha Dental",
      contactName: "Anita",
      phone: "1111111111",
      email: "alpha@test.local",
      status: "ACTIVE",
      assignedPartnerAgencyId: oid(ID.partnerAAgency),
      createdAt: daysAgo(90),
      updatedAt: daysAgo(90),
    },
    {
      _id: oid(ID.clientB),
      name: "Beta Motors",
      businessName: "Beta Motors",
      brandName: "Beta Motors",
      contactName: "Bala",
      phone: "2222222222",
      email: "beta@test.local",
      status: "ACTIVE",
      assignedPartnerAgencyId: oid(ID.partnerBAgency),
      createdAt: daysAgo(90),
      updatedAt: daysAgo(90),
    },
  ]);

  const roleAccounts = oid("66a0000000000000000000e1");
  const roleViewer = oid("66a0000000000000000000e2");
  const rolePartnerManager = oid("66a0000000000000000000e3");
  const rolePartnerWorker = oid("66a0000000000000000000e4");
  await db.collection("teamroles").insertMany([
    { _id: roleAccounts, roleName: "Account Manager", permissions: ["manage_clients", "view_clients"], isDeleted: false },
    { _id: roleViewer, roleName: "Reviewer", permissions: ["view_reviews"], isDeleted: false },
    { _id: rolePartnerManager, roleName: "Partner Manager", permissions: ["view_clients", "manage_team", "view_reviews", "manage_reviews", "view_tasks", "manage_tasks"], isDeleted: false },
    { _id: rolePartnerWorker, roleName: "Partner Worker", permissions: ["view_clients", "work_assigned_reviews", "work_assigned_tasks"], isDeleted: false },
  ]);

  await db.collection("users").insertMany([
    { _id: oid(ID.admin), email: ACCOUNTS.admin.email, name: ACCOUNTS.admin.name, role: "ADMIN", passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.managerNoPerm), email: ACCOUNTS.managerNoPerm.email, name: ACCOUNTS.managerNoPerm.name, role: "MANAGER", passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.managerClients), email: ACCOUNTS.managerClients.email, name: ACCOUNTS.managerClients.name, role: "MANAGER", passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.partnerAUser), email: ACCOUNTS.partnerA.email, name: ACCOUNTS.partnerA.name, role: "MANAGER", passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.partnerBUser), email: ACCOUNTS.partnerB.email, name: ACCOUNTS.partnerB.name, role: "MANAGER", passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.partnerAEmployeeUser), email: ACCOUNTS.partnerAEmployee.email, name: ACCOUNTS.partnerAEmployee.name, role: "AGENT", passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.clientAUser), email: ACCOUNTS.clientA.email, name: ACCOUNTS.clientA.name, role: "CLIENT", clientId: oid(ID.clientA), passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.clientBUser), email: ACCOUNTS.clientB.email, name: ACCOUNTS.clientB.name, role: "CLIENT", clientId: oid(ID.clientB), passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.clientAOwner), email: ACCOUNTS.clientAOwner.email, name: ACCOUNTS.clientAOwner.name, role: "CLIENT", clientId: oid(ID.clientA), passwordHash: hash, isActive: true, createdAt: now, updatedAt: now },
    { _id: oid(ID.clientInactive), email: ACCOUNTS.clientInactive.email, name: ACCOUNTS.clientInactive.name, role: "CLIENT", clientId: oid(ID.clientA), passwordHash: hash, isActive: false, createdAt: now, updatedAt: now },
  ]);

  await db.collection("partneragencies").insertMany([
    { _id: oid(ID.partnerAAgency), name: "Partner Agency A", code: "PA", status: "ACTIVE", isDeleted: false, createdAt: now, updatedAt: now },
    { _id: oid(ID.partnerBAgency), name: "Partner Agency B", code: "PB", status: "ACTIVE", isDeleted: false, createdAt: now, updatedAt: now },
  ]);

  await db.collection("teammembers").insertMany([
    { name: ACCOUNTS.managerNoPerm.name, email: ACCOUNTS.managerNoPerm.email, userId: ID.managerNoPerm, roleId: roleViewer, roleName: "Reviewer", accountType: "MAIN_EMPLOYEE", assignedClientIds: [], status: "Active", isDeleted: false, joinedAt: now, createdAt: now, updatedAt: now },
    { name: ACCOUNTS.managerClients.name, email: ACCOUNTS.managerClients.email, userId: ID.managerClients, roleId: roleAccounts, roleName: "Account Manager", accountType: "MAIN_EMPLOYEE", assignedClientIds: [], status: "Active", isDeleted: false, joinedAt: now, createdAt: now, updatedAt: now },
    { _id: oid(ID.partnerAMember), name: ACCOUNTS.partnerA.name, email: ACCOUNTS.partnerA.email, userId: ID.partnerAUser, roleId: rolePartnerManager, roleName: "Partner Manager", accountType: "PARTNER_AGENCY", partnerAgencyId: oid(ID.partnerAAgency), assignedClientIds: [], status: "Active", isDeleted: false, joinedAt: now, createdAt: now, updatedAt: now },
    { _id: oid(ID.partnerBMember), name: ACCOUNTS.partnerB.name, email: ACCOUNTS.partnerB.email, userId: ID.partnerBUser, roleId: rolePartnerManager, roleName: "Partner Manager", accountType: "PARTNER_AGENCY", partnerAgencyId: oid(ID.partnerBAgency), assignedClientIds: [], status: "Active", isDeleted: false, joinedAt: now, createdAt: now, updatedAt: now },
    { _id: oid(ID.partnerAEmployeeMember), name: ACCOUNTS.partnerAEmployee.name, email: ACCOUNTS.partnerAEmployee.email, userId: ID.partnerAEmployeeUser, roleId: rolePartnerWorker, roleName: "Partner Worker", accountType: "PARTNER_EMPLOYEE", partnerAgencyId: oid(ID.partnerAAgency), assignedClientIds: [], status: "Active", isDeleted: false, joinedAt: now, createdAt: now, updatedAt: now },
  ]);

  const draft = (id, clientId, clientName, subject, status, rating, createdAt) => ({
    _id: oid(id),
    subject,
    reviewText: `${subject} — great service.`,
    clientId: oid(clientId),
    clientName,
    category: "General",
    language: "English",
    suggestedRating: rating,
    tone: "Professional",
    reusable: true,
    status,
    createdBy: "Portal Admin",
    createdAt,
    updatedAt: createdAt,
  });
  await db.collection("reviewdrafts").insertMany([
    draft(ID.draftA1, ID.clientA, "Alpha Dental", "Alpha review one", "Used", "5", daysAgo(20)),
    draft(ID.draftA2, ID.clientA, "Alpha Dental", "Alpha draft two", "Available", "4", daysAgo(5)),
    draft(ID.draftA3, ID.clientA, "Alpha Dental", "Alpha review three", "Allocated", "5", daysAgo(8)),
    draft(ID.draftB1, ID.clientB, "Beta Motors", "Beta review one", "Shared", "3", daysAgo(15)),
  ]);

  await db.collection("reviewallocations").insertMany([
    {
      _id: oid(ID.allocA1),
      draftId: oid(ID.draftA1),
      assignedToUserId: "member-1",
      assignedToUserName: "Team Member",
      assignedByUserId: ID.admin,
      assignedByUserName: ACCOUNTS.admin.name,
      assignedDate: daysAgo(18),
      customerName: "Ramesh Kumar",
      platform: "Google",
      sentDate: daysAgo(12),
      allocationStatus: "Posted",
      assignedPartnerAgencyId: oid(ID.partnerAAgency),
      postedDate: daysAgo(10),
      usedDate: daysAgo(10),
      assigneeType: "MAIN_EMPLOYEE",
      createdAt: daysAgo(18),
      updatedAt: daysAgo(10),
    },
    {
      _id: oid(ID.allocA3),
      draftId: oid(ID.draftA3),
      assignedToUserId: ID.partnerAEmployeeMember,
      assignedToUserName: ACCOUNTS.partnerAEmployee.name,
      assignedByUserId: ID.admin,
      assignedByUserName: ACCOUNTS.admin.name,
      assignedDate: daysAgo(7),
      allocationStatus: "Assigned",
      assignedPartnerAgencyId: oid(ID.partnerAAgency),
      assigneeType: "MAIN_EMPLOYEE",
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
    },
    {
      _id: oid(ID.allocB1),
      draftId: oid(ID.draftB1),
      assignedToUserId: "member-2",
      assignedToUserName: "Other Member",
      assignedByUserId: ID.admin,
      assignedByUserName: ACCOUNTS.admin.name,
      assignedDate: daysAgo(14),
      customerName: "Beta Customer",
      platform: "Facebook",
      sentDate: daysAgo(9),
      allocationStatus: "Shared with Customer",
      assignedPartnerAgencyId: oid(ID.partnerBAgency),
      assigneeType: "MAIN_EMPLOYEE",
      createdAt: daysAgo(14),
      updatedAt: daysAgo(9),
    },
  ]);

  await db.collection("postedreviews").insertOne({
    _id: oid(ID.postedA1),
    allocationId: oid(ID.allocA1),
    draftId: oid(ID.draftA1),
    postedByName: "Ramesh Kumar",
    platform: "Google",
    reviewLink: "https://example.com/alpha-review",
    postedDate: daysAgo(10),
    markedUsedBy: ACCOUNTS.admin.name,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  });

  await db.collection("clientevents").insertMany([
    {
      _id: oid(ID.eventAVisible),
      clientId: oid(ID.clientA),
      entityType: "POSTED_REVIEW",
      entityId: oid(ID.postedA1),
      action: "REVIEW_POSTED",
      title: "Review posted on Google",
      description: "Ramesh Kumar's review went live on Google.",
      actorName: "Priya Sharma",
      actorRole: "AGENT",
      visibility: "CLIENT_VISIBLE",
      category: "REVIEW",
      source: "MANUAL",
      relatedReviewId: oid(ID.allocA1),
      relatedLabel: "Ramesh Kumar",
      occurredAt: daysAgo(10),
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      _id: oid(ID.eventAInternal),
      clientId: oid(ID.clientA),
      entityType: "REVIEW_ALLOCATION",
      entityId: oid(ID.allocA1),
      action: "ALLOCATION_UPDATED_INTERNAL",
      title: "SECRET internal escalation note",
      description: "Internal only — must never reach the client.",
      actorName: "Portal Admin",
      actorRole: "ADMIN",
      visibility: "INTERNAL",
      category: "DATA",
      source: "MANUAL",
      relatedReviewId: oid(ID.allocA1),
      occurredAt: daysAgo(9),
      createdAt: daysAgo(9),
      updatedAt: daysAgo(9),
    },
    {
      _id: oid(ID.eventBVisible),
      clientId: oid(ID.clientB),
      entityType: "REVIEW_ALLOCATION",
      entityId: oid(ID.allocB1),
      action: "REVIEW_SHARED",
      title: "BETA-ONLY review shared with customer",
      description: "Beta review one was shared with Beta Customer on Facebook.",
      actorName: "Neha Gupta",
      actorRole: "EMPLOYEE",
      visibility: "CLIENT_VISIBLE",
      category: "REVIEW",
      source: "MANUAL",
      relatedReviewId: oid(ID.allocB1),
      occurredAt: daysAgo(9),
      createdAt: daysAgo(9),
      updatedAt: daysAgo(9),
    },
  ]);

  await db.collection("clientupdates").insertMany([
    {
      _id: oid(ID.updateA),
      clientId: oid(ID.clientA),
      title: "Alpha campaign started",
      body: "We have started your Google review campaign.",
      category: "PROGRESS",
      postedByUserId: ID.admin,
      postedByName: ACCOUNTS.admin.name,
      postedByRole: "ADMIN",
      isPublished: true,
      publishedAt: daysAgo(3),
      readByUserIds: [],
      isDeleted: false,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      _id: oid(ID.updateADraft),
      clientId: oid(ID.clientA),
      title: "Alpha unpublished feature note",
      body: "A new reporting view is coming soon.",
      category: "FEATURE",
      postedByUserId: ID.admin,
      postedByName: ACCOUNTS.admin.name,
      postedByRole: "ADMIN",
      isPublished: false,
      readByUserIds: [],
      isDeleted: false,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      _id: oid(ID.updateB),
      clientId: oid(ID.clientB),
      title: "BETA-ONLY reporting schedule changed",
      body: "Beta reports now go out weekly.",
      category: "REPORTING",
      postedByUserId: ID.admin,
      postedByName: ACCOUNTS.admin.name,
      postedByRole: "ADMIN",
      isPublished: true,
      publishedAt: daysAgo(2),
      readByUserIds: [],
      isDeleted: false,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ]);

  await db.collection("tasks").insertMany([
    { _id: oid(ID.taskA), clientId: oid(ID.clientA), title: "Partner A task", assignedPartnerAgencyId: oid(ID.partnerAAgency), assignedToUserId: ID.partnerAEmployeeMember, assignedToName: ACCOUNTS.partnerAEmployee.name, priority: "MEDIUM", status: "TODO", createdAt: now, updatedAt: now },
    { _id: oid(ID.taskB), clientId: oid(ID.clientB), title: "Partner B task", assignedPartnerAgencyId: oid(ID.partnerBAgency), assignedToUserId: ID.partnerBMember, assignedToName: ACCOUNTS.partnerB.name, priority: "HIGH", status: "TODO", createdAt: now, updatedAt: now },
  ]);

  await db.collection("notifications").insertMany([
    {
      _id: oid(ID.notifA),
      userId: ID.clientAUser,
      clientId: oid(ID.clientA),
      type: "REVIEW_POSTED",
      title: "Review posted on Google",
      message: "Ramesh Kumar's review is live.",
      href: `/client/reviews/${ID.allocA1}`,
      isRead: false,
      createdAt: daysAgo(10),
    },
    {
      _id: oid(ID.notifB),
      userId: ID.clientBUser,
      clientId: oid(ID.clientB),
      type: "REVIEW_SHARED",
      title: "BETA-ONLY notification",
      message: "Beta review shared.",
      isRead: false,
      createdAt: daysAgo(9),
    },
    {
      _id: oid(ID.notifOwner1),
      userId: ID.clientAOwner,
      clientId: oid(ID.clientA),
      type: "REVIEW_POSTED",
      title: "Review posted on Google",
      message: "Ramesh Kumar's review is live.",
      isRead: false,
      createdAt: daysAgo(10),
    },
    {
      _id: oid(ID.notifOwner2),
      userId: ID.clientAOwner,
      clientId: oid(ID.clientA),
      type: "CLIENT_UPDATE",
      title: "Alpha campaign started",
      message: "We have started your Google review campaign.",
      isRead: false,
      createdAt: daysAgo(3),
    },
  ]);

  await conn.close();
}

if (process.argv[1] && process.argv[1].endsWith("seed.mjs")) {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    console.error("TEST_MONGODB_URI is required");
    process.exit(1);
  }
  await seedTestDatabase(uri);
  console.log("Seeded", uri);
}
