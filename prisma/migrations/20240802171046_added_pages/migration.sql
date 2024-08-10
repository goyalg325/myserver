-- CreateTable
CREATE TABLE "Pages" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,

    CONSTRAINT "Pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pages_title_key" ON "Pages"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Pages_route_key" ON "Pages"("route");
