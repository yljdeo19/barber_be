CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE "Role" AS ENUM ('CLIENT', 'SPECIALIST', 'ADMIN');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CLIENT',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "specialist_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "specialist_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "services" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "duration_min" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "specialist_services" (
  "specialist_id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  CONSTRAINT "specialist_services_pkey" PRIMARY KEY ("specialist_id", "service_id")
);

CREATE TABLE "working_hours" (
  "id" TEXT NOT NULL,
  "specialist_id" TEXT NOT NULL,
  "day_of_week" INTEGER NOT NULL,
  "start_minute" INTEGER NOT NULL,
  "end_minute" INTEGER NOT NULL,
  CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "working_hours_valid_day" CHECK ("day_of_week" BETWEEN 0 AND 6),
  CONSTRAINT "working_hours_valid_range" CHECK ("start_minute" >= 0 AND "end_minute" <= 1440 AND "start_minute" < "end_minute")
);

CREATE TABLE "bookings" (
  "id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "specialist_id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  "start_at" TIMESTAMPTZ(3) NOT NULL,
  "end_at" TIMESTAMPTZ(3) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bookings_valid_range" CHECK ("start_at" < "end_at")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "specialist_profiles_user_id_key" ON "specialist_profiles"("user_id");
CREATE UNIQUE INDEX "working_hours_specialist_id_day_of_week_key" ON "working_hours"("specialist_id", "day_of_week");
CREATE INDEX "bookings_client_id_start_at_idx" ON "bookings"("client_id", "start_at");
CREATE INDEX "bookings_specialist_id_start_at_idx" ON "bookings"("specialist_id", "start_at");

ALTER TABLE "specialist_profiles" ADD CONSTRAINT "specialist_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "specialist_services" ADD CONSTRAINT "specialist_services_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "specialist_services" ADD CONSTRAINT "specialist_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialist_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The database, rather than application timing, is the final authority on conflicts.
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_specialist_overlap"
  EXCLUDE USING gist (
    "specialist_id" WITH =,
    tstzrange("start_at", "end_at", '[)') WITH &&
  ) WHERE ("status" = 'CONFIRMED');
