/*
  Warnings:

  - A unique constraint covering the columns `[discord_id]` on the table `servers` will be added. If there are existing duplicate values, this will fail.

*/

-- CreateIndex
CREATE UNIQUE INDEX "servers.discord_id_unique" ON "servers"("discord_id");
