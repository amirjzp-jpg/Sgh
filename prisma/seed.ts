import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (names: string[]) => JSON.stringify(names.map((n) => `/seed/${n}.svg`));

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("Seed skipped — database already has data (npm run db:reset to start over)");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const [maya, arjun, sofia, dev, admin] = await Promise.all(
    [
      { name: "Maya Chen", email: "maya@example.com", city: "Kitsilano, Vancouver" },
      { name: "Arjun Patel", email: "arjun@example.com", city: "Mount Pleasant, Vancouver" },
      { name: "Sofia Reyes", email: "sofia@example.com", city: "Commercial Drive, Vancouver" },
      { name: "Dev Okafor", email: "dev@example.com", city: "North Vancouver" },
      { name: "Lolosel Admin", email: "admin@lolosel.ca", city: "Vancouver", isAdmin: true },
    ].map((u) => prisma.user.create({ data: { ...u, passwordHash } })),
  );

  const couriers = await Promise.all(
    ["Kai — cargo bike", "Priya — van", "Tomás — e-bike"].map((name) =>
      prisma.courier.create({ data: { name } }),
    ),
  );

  const L = async (
    seller: { id: string },
    title: string,
    priceCents: number,
    category: string,
    condition: string,
    description: string,
    images: string[],
    status = "active",
  ) =>
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        title,
        priceCents,
        category,
        condition,
        description,
        images: img(images),
        status,
      },
    });

  const teakSofa = await L(
    arjun,
    "Mid-century teak sofa — solid frame",
    42000,
    "Furniture",
    "Good",
    "Solid teak frame, newly cleaned cushions. Lived a good life in our Mount Pleasant apartment; moving to a smaller place. Pickup arranged through Lolosel courier — no truck needed on your end.",
    ["sofa"],
  );
  await L(
    arjun,
    "Walnut bookshelf, 5 shelves",
    9500,
    "Furniture",
    "Like new",
    "IKEA-adjacent but sturdier. Holds a full paperback wall. Disassembles into two flat pieces for the courier.",
    ["bookshelf"],
  );
  await L(
    maya,
    "Arc floor lamp with marble base",
    6500,
    "Furniture",
    "Good",
    "Classic arc lamp, warm bulb included. Small scuff on the base you'll never see.",
    ["lamp"],
  );
  await L(
    maya,
    '27" 1440p monitor (Dell)',
    18000,
    "Electronics",
    "Like new",
    "Dell S2721DS, barely used since I switched to a laptop-only setup. No dead pixels, original stand and cables.",
    ["monitor"],
  );
  await L(
    maya,
    "Sony WH-1000XM4 headphones",
    16500,
    "Electronics",
    "Good",
    "Great noise cancelling for the 99 B-Line. Ear pads recently replaced. Comes with case and cable.",
    ["headphones"],
  );
  await L(
    dev,
    "Mechanical keyboard — 75%, brown switches",
    9000,
    "Electronics",
    "Like new",
    "Keychron K2 with tape mod. Quiet enough for the office, clacky enough to feel alive.",
    ["keyboard"],
  );
  await L(
    sofia,
    "MEC Gore-Tex rain jacket, women's M",
    7500,
    "Clothing",
    "Good",
    "The Vancouver uniform. Zips all work, DWR refreshed this spring. Selling because I got a new colour.",
    ["jacket"],
  );
  await L(
    sofia,
    "Vintage floral dress, size S",
    3500,
    "Clothing",
    "Like new",
    "Bought at a Main Street vintage shop, worn twice. Beautiful drape, no stains or pulls.",
    ["dress"],
  );
  await L(
    dev,
    "Scarpa hiking boots, men's 10.5",
    11000,
    "Sports & Outdoors",
    "Good",
    "Broken in on the Grouse Grind but plenty of tread left. Resoleable quality you can't buy new at this price.",
    ["boots"],
  );
  await L(
    dev,
    "Road bike — 54cm aluminum, freshly tuned",
    38000,
    "Sports & Outdoors",
    "Good",
    "Commuter that earned its keep on the Adanac bikeway. New chain and brake pads last month. Helmet not included.",
    ["bike"],
  );
  await L(
    sofia,
    "Crate of 30 jazz records",
    12000,
    "Books & Media",
    "Fair",
    "Mostly 60s–70s pressings, sleeves show their age, vinyl plays clean. Selling as one lot only.",
    ["records"],
  );
  await L(
    dev,
    "Cross-country skis + poles, 180cm",
    8500,
    "Sports & Outdoors",
    "Fair",
    "Waxable classics for Cypress or Callaghan. A few base scratches, nothing structural.",
    ["skis"],
  );
  await L(
    maya,
    "Breville espresso machine",
    22000,
    "Home & Kitchen",
    "Good",
    "Barista Express, descaled regularly. Makes better shots than half the cafés on West 4th. Includes tamper and jug.",
    ["espresso"],
  );
  await L(
    sofia,
    "Monstera + pothos bundle (3 plants)",
    4000,
    "Home & Kitchen",
    "Good",
    "Healthy, rooted, and ready for a new windowsill. Pots included. Courier-friendly — I'll pack them snug.",
    ["plants"],
  );

  // ── One completed order so wallet / reviews / ratings aren't empty ──
  const armchair = await L(
    arjun,
    "Mid-century armchair, reupholstered",
    15000,
    "Furniture",
    "Good",
    "Reupholstered in mustard wool two years ago. The reading chair of your dreams.",
    ["armchair"],
    "sold",
  );

  const order = await prisma.order.create({
    data: {
      listingId: armchair.id,
      buyerId: maya.id,
      sellerId: arjun.id,
      amountCents: 15000,
      status: "confirmed",
      paymentRef: "mockpay_seed_demo",
      courierId: couriers[0].id,
      createdAt: new Date(Date.now() - 6 * 86_400_000),
    },
  });

  const day = 86_400_000;
  const eventTimes: [string, number][] = [
    ["courier_assigned", 6],
    ["picked_up", 5],
    ["in_transit", 5],
    ["delivered", 4],
  ];
  for (const [status, daysAgo] of eventTimes) {
    await prisma.deliveryEvent.create({
      data: {
        orderId: order.id,
        courierId: couriers[0].id,
        status,
        timestamp: new Date(Date.now() - daysAgo * day),
      },
    });
  }

  await prisma.walletTxn.create({
    data: {
      userId: maya.id,
      type: "debit",
      amountCents: 15000,
      orderId: order.id,
      status: "completed",
      createdAt: new Date(Date.now() - 6 * day),
    },
  });
  await prisma.walletTxn.create({
    data: {
      userId: arjun.id,
      type: "credit",
      amountCents: 15000,
      orderId: order.id,
      status: "released",
      createdAt: new Date(Date.now() - 6 * day),
    },
  });

  await prisma.review.create({
    data: {
      orderId: order.id,
      fromUserId: maya.id,
      toUserId: arjun.id,
      rating: 5,
      comment: "Chair was exactly as described and the courier handoff was painless. Thanks Arjun!",
    },
  });
  await prisma.review.create({
    data: {
      orderId: order.id,
      fromUserId: arjun.id,
      toUserId: maya.id,
      rating: 5,
      comment: "Smooth sale, quick confirmation. Great buyer.",
    },
  });
  await prisma.user.update({ where: { id: arjun.id }, data: { rating: 5 } });
  await prisma.user.update({ where: { id: maya.id }, data: { rating: 5 } });

  // ── A couple of live chat threads ──
  const convo1 = await prisma.conversation.create({
    data: { listingId: teakSofa.id, buyerId: sofia.id, sellerId: arjun.id },
  });
  const msgs1: [string, string, number][] = [
    [sofia.id, "Hi! Is the sofa frame solid teak or veneer?", 26],
    [arjun.id, "Solid teak — legs and frame. Only the cushion covers are newer.", 25],
    [sofia.id, "Nice. Would you take $380 for it?", 24],
    [arjun.id, "I could meet you at $400 — it's priced to move already.", 23],
  ];
  for (const [senderId, content, hoursAgo] of msgs1) {
    await prisma.message.create({
      data: {
        conversationId: convo1.id,
        senderId,
        content,
        createdAt: new Date(Date.now() - hoursAgo * 3_600_000),
      },
    });
  }
  await prisma.offer.create({
    data: {
      listingId: teakSofa.id,
      buyerId: sofia.id,
      amountCents: 38000,
      status: "countered",
      createdAt: new Date(Date.now() - 24 * 3_600_000),
    },
  });
  await prisma.offer.create({
    data: {
      listingId: teakSofa.id,
      buyerId: sofia.id,
      amountCents: 40000,
      status: "pending",
      fromSeller: true,
      createdAt: new Date(Date.now() - 23 * 3_600_000),
    },
  });

  const bikeListing = await prisma.listing.findFirstOrThrow({
    where: { title: { contains: "Road bike" } },
  });
  const convo2 = await prisma.conversation.create({
    data: { listingId: bikeListing.id, buyerId: maya.id, sellerId: dev.id },
  });
  const msgs2: [string, string, number][] = [
    [maya.id, "Hey Dev — how many kms roughly on the drivetrain?", 8],
    [dev.id, "New chain last month; cassette has maybe 2000km. Shifts clean.", 7],
    [maya.id, "Perfect, I'll take a look at the photos tonight.", 6],
  ];
  for (const [senderId, content, hoursAgo] of msgs2) {
    await prisma.message.create({
      data: {
        conversationId: convo2.id,
        senderId,
        content,
        createdAt: new Date(Date.now() - hoursAgo * 3_600_000),
      },
    });
  }

  console.log("Seeded: 5 users, 3 couriers, 15 listings, 2 chats, 1 completed order.");
  console.log("Log in as maya@example.com / arjun@example.com / sofia@example.com / dev@example.com");
  console.log("(admin: admin@lolosel.ca) — password for everyone: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
