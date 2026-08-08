-- 002_add_user_roles.sql
-- Adds authorization fields required by the web frontend after migrating
-- authentication from the old Next.js session system to Go JWT auth.
-- Additive only: the previous binary (which never SELECTs these columns) keeps
-- working while this is applied.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role        VARCHAR(20) NOT NULL DEFAULT 'USER',
    ADD COLUMN IF NOT EXISTS agency_id   UUID,
    ADD COLUMN IF NOT EXISTS agency_kind VARCHAR(30);

-- Restrict role to the values the frontend understands.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'USER'));
    END IF;
END$$;

-- Promote the bootstrap administrator account. All other users default to USER
-- and resolve their permissions through the existing team-member records.
UPDATE users SET role = 'ADMIN' WHERE email = 'mail@db2.in';
