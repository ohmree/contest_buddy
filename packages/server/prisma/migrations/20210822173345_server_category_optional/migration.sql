-- AlterTable
ALTER TABLE "servers" ALTER COLUMN "category_name" SET DEFAULT E'contests',
ALTER COLUMN "category_id" DROP NOT NULL;
