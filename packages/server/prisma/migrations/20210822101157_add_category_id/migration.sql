/*
  Warnings:

  - Added the required column `category_id` to the `servers` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "category_id" TEXT NOT NULL;
