-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "type" "ProgramType" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expires" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "_ProgramInvitations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramInvitations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProgramInvitations_B_index" ON "_ProgramInvitations"("B");

-- AddForeignKey
ALTER TABLE "_ProgramInvitations" ADD CONSTRAINT "_ProgramInvitations_A_fkey" FOREIGN KEY ("A") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramInvitations" ADD CONSTRAINT "_ProgramInvitations_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
