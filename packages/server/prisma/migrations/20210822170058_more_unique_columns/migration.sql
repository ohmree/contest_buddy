/*
  Warnings:

  - A unique constraint covering the columns `[category_id]` on the table `servers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[discord_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/

-- CreateIndex
CREATE UNIQUE INDEX "servers.category_id_unique" ON "servers"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "users.discord_id_unique" ON "users"("discord_id");
