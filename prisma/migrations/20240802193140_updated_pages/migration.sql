/*
  Warnings:

  - You are about to drop the column `content` on the `Pages` table. All the data in the column will be lost.
  - You are about to drop the column `route` on the `Pages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contentPath]` on the table `Pages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Pages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentPath` to the `Pages` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Pages_route_key";

-- AlterTable
ALTER TABLE "Pages" DROP COLUMN "content",
DROP COLUMN "route",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "contentPath" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Pages_contentPath_key" ON "Pages"("contentPath");
