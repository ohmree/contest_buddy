CREATE EXTENSION IF NOT EXISTS "pg_hashids";
CREATE SEQUENCE "contests_id_seq" AS integer;
CREATE SEQUENCE "submissions_id_seq" AS integer;
CREATE SEQUENCE "users_id_seq" AS integer;

-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL DEFAULT id_encode(nextval('contests_id_seq'::text)),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "pictures_only" BOOLEAN NOT NULL DEFAULT false,
    "max_submissions" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("id")
);
ALTER SEQUENCE "contests_id_seq" OWNED BY "contests"."id";

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL DEFAULT id_encode(nextval('submissions_id_seq'::text)),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "caption" TEXT,

    PRIMARY KEY ("id")
);
ALTER SEQUENCE "submissions_id_seq" OWNED BY "submissions"."id";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT id_encode(nextval('users_id_seq'::text)),
    "discord_tag" TEXT NOT NULL,
    "twitch_name" TEXT NOT NULL,
    "twitch_display_name" TEXT NOT NULL,
    "profile_url" TEXT NOT NULL,

    PRIMARY KEY ("id")
);
ALTER SEQUENCE "users_id_seq" OWNED BY "users"."id";

-- CreateTable
CREATE TABLE "contest_participants" (
    "user_id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,

    PRIMARY KEY ("user_id","contest_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users.discord_tag_unique" ON "users"("discord_tag");

-- CreateIndex
CREATE UNIQUE INDEX "users.twitch_name_unique" ON "users"("twitch_name");

-- CreateIndex
CREATE UNIQUE INDEX "users.twitch_display_name_unique" ON "users"("twitch_display_name");

-- AddForeignKey
ALTER TABLE "submissions" ADD FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_participants" ADD FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_participants" ADD FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
