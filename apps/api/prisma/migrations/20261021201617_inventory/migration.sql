-- CreateEnum
CREATE TYPE "stock_movement_type" AS ENUM ('receive', 'adjust', 'write_off', 'transfer_out', 'transfer_in', 'reserve', 'release', 'fulfil', 'return');

-- CreateTable
CREATE TABLE "stock_location" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "address" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_level" (
    "variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_level_pkey" PRIMARY KEY ("variant_id","location_id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "type" "stock_movement_type" NOT NULL,
    "on_hand_delta" INTEGER NOT NULL,
    "reserved_delta" INTEGER NOT NULL DEFAULT 0,
    "on_hand_after" INTEGER NOT NULL,
    "reason" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_location_code_key" ON "stock_location"("code");

-- CreateIndex
CREATE INDEX "stock_level_location_id_idx" ON "stock_level"("location_id");

-- CreateIndex
CREATE INDEX "stock_movement_variant_id_created_at_idx" ON "stock_movement"("variant_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movement_location_id_created_at_idx" ON "stock_movement"("location_id", "created_at");

-- AddForeignKey
ALTER TABLE "stock_level" ADD CONSTRAINT "stock_level_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_level" ADD CONSTRAINT "stock_level_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one default stock location.
CREATE UNIQUE INDEX "stock_location_single_default" ON "stock_location" ("is_default") WHERE "is_default";
-- Stock can't go negative.
ALTER TABLE "stock_level" ADD CONSTRAINT "stock_level_on_hand_non_negative" CHECK ("on_hand" >= 0);
ALTER TABLE "stock_level" ADD CONSTRAINT "stock_level_reserved_non_negative" CHECK ("reserved" >= 0);
