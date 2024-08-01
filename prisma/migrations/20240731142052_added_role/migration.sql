/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `Users` table. All the data in the column will be lost.
  - You are about to alter the column `username` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Editor', 'Admin');

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "isAdmin",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'Editor',
ALTER COLUMN "username" SET DATA TYPE VARCHAR(191);
