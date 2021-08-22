-- DropIndex
DROP INDEX "users.twitch_name_unique";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "twitch_name" DROP NOT NULL,
ALTER COLUMN "twitch_display_name" DROP NOT NULL;
