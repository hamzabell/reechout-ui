-- Drop the old global unique constraint on email
DROP INDEX IF EXISTS "prospects_email_key";

-- Create the new composite unique constraint on (email, createdBy)
CREATE UNIQUE INDEX "prospects_email_createdBy_key" ON "prospects"("email", "createdBy");
