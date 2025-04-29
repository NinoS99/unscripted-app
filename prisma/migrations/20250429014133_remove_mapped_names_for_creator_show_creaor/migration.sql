/*
  This migration renames tables instead of dropping/recreating them
  to preserve existing data while removing the @@map declarations
*/

-- Rename tables to their new names (model names)
ALTER TABLE "creators" RENAME TO "Creator";
ALTER TABLE "shows_creators" RENAME TO "ShowCreator";

-- Recreate foreign keys (needed because constraint names change)
ALTER TABLE "ShowCreator" DROP CONSTRAINT "shows_creators_creatorId_fkey";
ALTER TABLE "ShowCreator" DROP CONSTRAINT "shows_creators_showId_fkey";

-- Add new foreign keys with updated constraint names
ALTER TABLE "ShowCreator" ADD CONSTRAINT "ShowCreator_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShowCreator" ADD CONSTRAINT "ShowCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;