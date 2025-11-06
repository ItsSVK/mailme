-- CreateTable
CREATE TABLE "Mailbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mailboxId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "subject" TEXT,
    "text" TEXT,
    "html" TEXT,
    "raw" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Email_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_username_key" ON "Mailbox"("username");

-- CreateIndex
CREATE INDEX "Email_mailboxId_createdAt_idx" ON "Email"("mailboxId", "createdAt");
