-- Lolosel — one-shot setup for a FRESH (empty) Supabase project.
-- Paste into Supabase dashboard → SQL Editor → Run.
-- Creates the schema and the demo data (idempotent inserts).
-- The Vercel build's `prisma db push` + seed will then find everything in place and no-op.

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Vancouver',
    "avatarUrl" TEXT,
    "rating" DOUBLE PRECISION,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fromSeller" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerLastReadAt" TIMESTAMP(3),
    "sellerLastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid_escrow',
    "paymentRef" TEXT,
    "courierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Courier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTxn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "orderId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTxn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "listingId" TEXT,
    "reason" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_listingId_buyerId_key" ON "Conversation"("listingId", "buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_fromUserId_key" ON "Review"("orderId", "fromUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTxn" ADD CONSTRAINT "WalletTxn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTxn" ADD CONSTRAINT "WalletTxn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ─── Demo data (mirrors prisma/seed.ts) ─────────────────────────────────────
-- Password for every account: password123

BEGIN;

INSERT INTO "User" ("id","name","email","passwordHash","city","isAdmin","rating") VALUES
  ('user_maya',  'Maya Chen',     'maya@example.com',  '$2a$10$rAfU/IERsVMjT7gXVB9XquZ7dWjjk.aoYlKaO6quAmcRnUb8Wd4Yu', 'Kitsilano, Vancouver',        false, 5),
  ('user_arjun', 'Arjun Patel',   'arjun@example.com', '$2a$10$rAfU/IERsVMjT7gXVB9XquZ7dWjjk.aoYlKaO6quAmcRnUb8Wd4Yu', 'Mount Pleasant, Vancouver',   false, 5),
  ('user_sofia', 'Sofia Reyes',   'sofia@example.com', '$2a$10$rAfU/IERsVMjT7gXVB9XquZ7dWjjk.aoYlKaO6quAmcRnUb8Wd4Yu', 'Commercial Drive, Vancouver', false, NULL),
  ('user_dev',   'Dev Okafor',    'dev@example.com',   '$2a$10$rAfU/IERsVMjT7gXVB9XquZ7dWjjk.aoYlKaO6quAmcRnUb8Wd4Yu', 'North Vancouver',             false, NULL),
  ('user_admin', 'Lolosel Admin', 'admin@lolosel.ca',  '$2a$10$rAfU/IERsVMjT7gXVB9XquZ7dWjjk.aoYlKaO6quAmcRnUb8Wd4Yu', 'Vancouver',                   true,  NULL)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Courier" ("id","name") VALUES
  ('courier_kai',   'Kai — cargo bike'),
  ('courier_priya', 'Priya — van'),
  ('courier_tomas', 'Tomás — e-bike')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Listing" ("id","sellerId","title","description","priceCents","category","condition","images","status") VALUES
  ('lst_sofa',      'user_arjun', 'Mid-century teak sofa — solid frame', 'Solid teak frame, newly cleaned cushions. Lived a good life in our Mount Pleasant apartment; moving to a smaller place. Pickup arranged through Lolosel courier — no truck needed on your end.', 42000, 'Furniture', 'Good', '["/seed/sofa.svg"]', 'active'),
  ('lst_bookshelf', 'user_arjun', 'Walnut bookshelf, 5 shelves', 'IKEA-adjacent but sturdier. Holds a full paperback wall. Disassembles into two flat pieces for the courier.', 9500, 'Furniture', 'Like new', '["/seed/bookshelf.svg"]', 'active'),
  ('lst_lamp',      'user_maya', 'Arc floor lamp with marble base', 'Classic arc lamp, warm bulb included. Small scuff on the base you''ll never see.', 6500, 'Furniture', 'Good', '["/seed/lamp.svg"]', 'active'),
  ('lst_monitor',   'user_maya', '27" 1440p monitor (Dell)', 'Dell S2721DS, barely used since I switched to a laptop-only setup. No dead pixels, original stand and cables.', 18000, 'Electronics', 'Like new', '["/seed/monitor.svg"]', 'active'),
  ('lst_headphones','user_maya', 'Sony WH-1000XM4 headphones', 'Great noise cancelling for the 99 B-Line. Ear pads recently replaced. Comes with case and cable.', 16500, 'Electronics', 'Good', '["/seed/headphones.svg"]', 'active'),
  ('lst_keyboard',  'user_dev', 'Mechanical keyboard — 75%, brown switches', 'Keychron K2 with tape mod. Quiet enough for the office, clacky enough to feel alive.', 9000, 'Electronics', 'Like new', '["/seed/keyboard.svg"]', 'active'),
  ('lst_jacket',    'user_sofia', 'MEC Gore-Tex rain jacket, women''s M', 'The Vancouver uniform. Zips all work, DWR refreshed this spring. Selling because I got a new colour.', 7500, 'Clothing', 'Good', '["/seed/jacket.svg"]', 'active'),
  ('lst_dress',     'user_sofia', 'Vintage floral dress, size S', 'Bought at a Main Street vintage shop, worn twice. Beautiful drape, no stains or pulls.', 3500, 'Clothing', 'Like new', '["/seed/dress.svg"]', 'active'),
  ('lst_boots',     'user_dev', 'Scarpa hiking boots, men''s 10.5', 'Broken in on the Grouse Grind but plenty of tread left. Resoleable quality you can''t buy new at this price.', 11000, 'Sports & Outdoors', 'Good', '["/seed/boots.svg"]', 'active'),
  ('lst_bike',      'user_dev', 'Road bike — 54cm aluminum, freshly tuned', 'Commuter that earned its keep on the Adanac bikeway. New chain and brake pads last month. Helmet not included.', 38000, 'Sports & Outdoors', 'Good', '["/seed/bike.svg"]', 'active'),
  ('lst_records',   'user_sofia', 'Crate of 30 jazz records', 'Mostly 60s–70s pressings, sleeves show their age, vinyl plays clean. Selling as one lot only.', 12000, 'Books & Media', 'Fair', '["/seed/records.svg"]', 'active'),
  ('lst_skis',      'user_dev', 'Cross-country skis + poles, 180cm', 'Waxable classics for Cypress or Callaghan. A few base scratches, nothing structural.', 8500, 'Sports & Outdoors', 'Fair', '["/seed/skis.svg"]', 'active'),
  ('lst_espresso',  'user_maya', 'Breville espresso machine', 'Barista Express, descaled regularly. Makes better shots than half the cafés on West 4th. Includes tamper and jug.', 22000, 'Home & Kitchen', 'Good', '["/seed/espresso.svg"]', 'active'),
  ('lst_plants',    'user_sofia', 'Monstera + pothos bundle (3 plants)', 'Healthy, rooted, and ready for a new windowsill. Pots included. Courier-friendly — I''ll pack them snug.', 4000, 'Home & Kitchen', 'Good', '["/seed/plants.svg"]', 'active'),
  ('lst_armchair',  'user_arjun', 'Mid-century armchair, reupholstered', 'Reupholstered in mustard wool two years ago. The reading chair of your dreams.', 15000, 'Furniture', 'Good', '["/seed/armchair.svg"]', 'sold')
ON CONFLICT ("id") DO NOTHING;

-- Completed order (armchair: maya bought from arjun) so wallet/reviews aren't empty
INSERT INTO "Order" ("id","listingId","buyerId","sellerId","amountCents","status","paymentRef","courierId","createdAt") VALUES
  ('ord_armchair', 'lst_armchair', 'user_maya', 'user_arjun', 15000, 'confirmed', 'mockpay_seed_demo', 'courier_kai', NOW() - INTERVAL '6 days')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "DeliveryEvent" ("id","orderId","courierId","status","timestamp") VALUES
  ('devt_1', 'ord_armchair', 'courier_kai', 'courier_assigned', NOW() - INTERVAL '6 days'),
  ('devt_2', 'ord_armchair', 'courier_kai', 'picked_up',        NOW() - INTERVAL '5 days'),
  ('devt_3', 'ord_armchair', 'courier_kai', 'in_transit',       NOW() - INTERVAL '5 days'),
  ('devt_4', 'ord_armchair', 'courier_kai', 'delivered',        NOW() - INTERVAL '4 days')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "WalletTxn" ("id","userId","type","amountCents","orderId","status","createdAt") VALUES
  ('txn_maya_debit',   'user_maya',  'debit',  15000, 'ord_armchair', 'completed', NOW() - INTERVAL '6 days'),
  ('txn_arjun_credit', 'user_arjun', 'credit', 15000, 'ord_armchair', 'released',  NOW() - INTERVAL '6 days')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Review" ("id","orderId","fromUserId","toUserId","rating","comment") VALUES
  ('rev_1', 'ord_armchair', 'user_maya',  'user_arjun', 5, 'Chair was exactly as described and the courier handoff was painless. Thanks Arjun!'),
  ('rev_2', 'ord_armchair', 'user_arjun', 'user_maya',  5, 'Smooth sale, quick confirmation. Great buyer.')
ON CONFLICT ("id") DO NOTHING;

-- Live chat threads
INSERT INTO "Conversation" ("id","listingId","buyerId","sellerId") VALUES
  ('conv_sofa', 'lst_sofa', 'user_sofia', 'user_arjun'),
  ('conv_bike', 'lst_bike', 'user_maya',  'user_dev')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Message" ("id","conversationId","senderId","content","createdAt") VALUES
  ('msg_1', 'conv_sofa', 'user_sofia', 'Hi! Is the sofa frame solid teak or veneer?',                        NOW() - INTERVAL '26 hours'),
  ('msg_2', 'conv_sofa', 'user_arjun', 'Solid teak — legs and frame. Only the cushion covers are newer.',    NOW() - INTERVAL '25 hours'),
  ('msg_3', 'conv_sofa', 'user_sofia', 'Nice. Would you take $380 for it?',                                  NOW() - INTERVAL '24 hours'),
  ('msg_4', 'conv_sofa', 'user_arjun', 'I could meet you at $400 — it''s priced to move already.',           NOW() - INTERVAL '23 hours'),
  ('msg_5', 'conv_bike', 'user_maya',  'Hey Dev — how many kms roughly on the drivetrain?',                  NOW() - INTERVAL '8 hours'),
  ('msg_6', 'conv_bike', 'user_dev',   'New chain last month; cassette has maybe 2000km. Shifts clean.',     NOW() - INTERVAL '7 hours'),
  ('msg_7', 'conv_bike', 'user_maya',  'Perfect, I''ll take a look at the photos tonight.',                  NOW() - INTERVAL '6 hours')
ON CONFLICT ("id") DO NOTHING;

-- Sofa negotiation: sofia offered $380, arjun countered $400 (pending, waiting on sofia)
INSERT INTO "Offer" ("id","listingId","buyerId","amountCents","status","fromSeller","createdAt") VALUES
  ('off_sofia_380', 'lst_sofa', 'user_sofia', 38000, 'countered', false, NOW() - INTERVAL '24 hours'),
  ('off_arjun_400', 'lst_sofa', 'user_sofia', 40000, 'pending',   true,  NOW() - INTERVAL '23 hours')
ON CONFLICT ("id") DO NOTHING;

COMMIT;
