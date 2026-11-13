-- Momento 2: never delete existing business records.
ALTER TABLE "Product" ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD CONSTRAINT "product_discount_range_check" CHECK ("discountPercent" BETWEEN 0 AND 100);
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_rating_range_check" CHECK ("rating" BETWEEN 0 AND 5)
);
CREATE INDEX "reviews_product_id_idx" ON "reviews"("productId");
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
