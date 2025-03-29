/*
  Warnings:

  - You are about to drop the column `contentPath` on the `Pages` table. All the data in the column will be lost.
  - Added the required column `content` to the `Pages` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Pages_contentPath_key";

-- AlterTable
ALTER TABLE "Pages" DROP COLUMN "contentPath",
ADD COLUMN     "content" TEXT NOT NULL;
