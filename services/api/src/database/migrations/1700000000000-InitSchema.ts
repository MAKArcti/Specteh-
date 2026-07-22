import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('customer', 'operator', 'equipment_owner', 'admin')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "roles" "users_role_enum"[] NOT NULL,
        "fullName" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "email" character varying,
        "passwordHash" character varying NOT NULL,
        "ratingAvg" double precision NOT NULL DEFAULT 0,
        "ratingCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_phone" ON "users" ("phone")`);

    await queryRunner.query(
      `CREATE TYPE "equipment_type_enum" AS ENUM ('excavator', 'bulldozer', 'crane', 'dump_truck', 'loader', 'concrete_mixer', 'grader')`,
    );
    await queryRunner.query(
      `CREATE TYPE "equipment_status_enum" AS ENUM ('available', 'booked', 'working', 'maintenance', 'broken', 'inactive')`,
    );
    await queryRunner.query(`
      CREATE TABLE "equipment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ownerId" uuid NOT NULL,
        "type" "equipment_type_enum" NOT NULL,
        "label" character varying NOT NULL,
        "pricePerHour" double precision NOT NULL,
        "location" geography(Point,4326) NOT NULL,
        "status" "equipment_status_enum" NOT NULL DEFAULT 'available',
        "ratingAvg" double precision NOT NULL DEFAULT 0,
        "ratingCount" integer NOT NULL DEFAULT 0,
        "brand" character varying,
        "model" character varying,
        "serialNumber" character varying,
        "photoUrl" character varying,
        "engineHours" double precision,
        "fuelConsumption" character varying,
        "oilStatus" character varying,
        "mass" character varying,
        "capacity" character varying,
        "conditions" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_equipment_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_equipment_ownerId" ON "equipment" ("ownerId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_equipment_location" ON "equipment" USING GIST ("location")`,
    );

    await queryRunner.query(`
      CREATE TABLE "equipment_operators" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "equipmentId" uuid NOT NULL,
        "operatorId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_equipment_operators_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_equipment_operators_equipmentId" ON "equipment_operators" ("equipmentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_equipment_operators_operatorId" ON "equipment_operators" ("operatorId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_equipment_operators_pair" ON "equipment_operators" ("equipmentId", "operatorId")`,
    );

    await queryRunner.query(
      `CREATE TYPE "equipment_journal_kind_enum" AS ENUM ('service', 'oil', 'repair', 'breakdown', 'work')`,
    );
    await queryRunner.query(`
      CREATE TABLE "equipment_journal" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "equipmentId" uuid NOT NULL,
        "kind" "equipment_journal_kind_enum" NOT NULL,
        "authorId" uuid NOT NULL,
        "authorLabel" character varying NOT NULL,
        "text" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_equipment_journal_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_equipment_journal_equipmentId" ON "equipment_journal" ("equipmentId")`,
    );

    await queryRunner.query(
      `CREATE TYPE "equipment_requests_status_enum" AS ENUM ('open', 'matched', 'cancelled', 'expired')`,
    );
    await queryRunner.query(`
      CREATE TABLE "equipment_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customerId" uuid NOT NULL,
        "equipmentType" "equipment_type_enum" NOT NULL,
        "location" geography(Point,4326) NOT NULL,
        "searchRadiusKm" double precision NOT NULL,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "equipment_requests_status_enum" NOT NULL DEFAULT 'open',
        "notes" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_equipment_requests_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_equipment_requests_customerId" ON "equipment_requests" ("customerId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "match_offers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "requestId" uuid NOT NULL,
        "equipmentId" uuid NOT NULL,
        "distanceKm" double precision NOT NULL,
        "priceEstimate" double precision NOT NULL,
        "score" double precision NOT NULL,
        "rank" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_match_offers_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_match_offers_requestId" ON "match_offers" ("requestId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_match_offers_equipmentId" ON "match_offers" ("equipmentId")`,
    );

    await queryRunner.query(
      `CREATE TYPE "deals_status_enum" AS ENUM ('pending_confirmation', 'confirmed', 'in_progress', 'completed', 'settled', 'cancelled', 'disputed')`,
    );
    await queryRunner.query(`
      CREATE TABLE "deals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "requestId" uuid NOT NULL,
        "equipmentId" uuid NOT NULL,
        "customerId" uuid NOT NULL,
        "operatorId" uuid NOT NULL,
        "status" "deals_status_enum" NOT NULL DEFAULT 'pending_confirmation',
        "agreedPricePerHour" double precision NOT NULL,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_deals_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_deals_requestId" ON "deals" ("requestId")`);
    await queryRunner.query(`CREATE INDEX "IDX_deals_equipmentId" ON "deals" ("equipmentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_deals_customerId" ON "deals" ("customerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_deals_operatorId" ON "deals" ("operatorId")`);

    await queryRunner.query(
      `CREATE TYPE "orders_status_enum" AS ENUM ('draft', 'request', 'agreed', 'in_work', 'done', 'cancelled')`,
    );
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "renterId" uuid NOT NULL,
        "equipmentType" "equipment_type_enum" NOT NULL,
        "equipmentId" uuid,
        "operatorId" uuid,
        "ownerId" uuid,
        "location" character varying NOT NULL,
        "dateFrom" character varying NOT NULL,
        "dateTo" character varying NOT NULL,
        "comment" character varying,
        "status" "orders_status_enum" NOT NULL DEFAULT 'request',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_renterId" ON "orders" ("renterId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_equipmentId" ON "orders" ("equipmentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_operatorId" ON "orders" ("operatorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_ownerId" ON "orders" ("ownerId")`);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL,
        "senderId" uuid,
        "isSystem" boolean NOT NULL DEFAULT false,
        "text" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_chat_messages_orderId" ON "chat_messages" ("orderId")`);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "text" character varying NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`);

    await queryRunner.query(
      `CREATE TYPE "reports_syncstatus_enum" AS ENUM ('pending', 'queued', 'synced', 'rejected')`,
    );
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "clientReportId" character varying NOT NULL,
        "orderId" uuid NOT NULL,
        "operatorId" uuid NOT NULL,
        "capturedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "receivedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "startedAt" TIMESTAMP WITH TIME ZONE,
        "endedAt" TIMESTAMP WITH TIME ZONE,
        "durationMin" integer,
        "text" text NOT NULL,
        "gps" geography(Point,4326) NOT NULL,
        "photos" jsonb NOT NULL DEFAULT '{}',
        "engineHours" double precision,
        "fuelConsumption" character varying,
        "problem" boolean NOT NULL DEFAULT false,
        "needsService" boolean NOT NULL DEFAULT false,
        "syncStatus" "reports_syncstatus_enum" NOT NULL DEFAULT 'queued',
        "rejectionReason" character varying,
        "confirmed" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_reports_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_reports_clientReportId" ON "reports" ("clientReportId")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_reports_orderId" ON "reports" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_operatorId" ON "reports" ("operatorId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "reports_syncstatus_enum"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "deals"`);
    await queryRunner.query(`DROP TYPE "deals_status_enum"`);
    await queryRunner.query(`DROP TABLE "match_offers"`);
    await queryRunner.query(`DROP TABLE "equipment_requests"`);
    await queryRunner.query(`DROP TYPE "equipment_requests_status_enum"`);
    await queryRunner.query(`DROP TABLE "equipment_journal"`);
    await queryRunner.query(`DROP TYPE "equipment_journal_kind_enum"`);
    await queryRunner.query(`DROP TABLE "equipment_operators"`);
    await queryRunner.query(`DROP TABLE "equipment"`);
    await queryRunner.query(`DROP TYPE "equipment_status_enum"`);
    await queryRunner.query(`DROP TYPE "equipment_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
