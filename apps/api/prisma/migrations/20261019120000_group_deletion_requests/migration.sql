-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "deletion_requested_at" TIMESTAMP(3),
ADD COLUMN     "delete_after" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "groups_delete_after_idx" ON "groups"("delete_after");
