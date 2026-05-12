// Run: npx ts-node --project tsconfig.json prisma/seed-reviews.ts
// Seeds ~400 approved reviews per flavor matching original pre-hack averages.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const FLAVORS = [
  { sku: "GB-SP-3OZ",  name: "Salt & Pepper",         avgRating: 4.7 },
  { sku: "GB-SPG-3OZ", name: "Salt, Pepper & Garlic",  avgRating: 4.8 },
  { sku: "GB-SSP-3OZ", name: "Serrano Salt & Pepper",  avgRating: 4.5 },
  { sku: "GB-CA-3OZ",  name: "Carne Asada",            avgRating: 4.9 },
  { sku: "GB-BB-3OZ",  name: "Simply Bar-B",           avgRating: 4.6 },
];

const FIRST_NAMES = [
  "James","Michael","Robert","John","David","Daniel","Chris","Matt","Tyler","Josh",
  "Kevin","Brian","Ryan","Justin","Andrew","Scott","Brandon","Eric","Adam","Jeff",
  "Sarah","Jennifer","Amanda","Jessica","Ashley","Emily","Megan","Rachel","Lauren","Nicole",
  "Amy","Stephanie","Rebecca","Heather","Melissa","Brittany","Amber","Katie","Kelly","Lisa",
  "Carlos","Miguel","Jose","Luis","Marco","Antonio","Diego","Rafael","Hector","Eduardo",
  "Wei","Jason","Derek","Nathan","Aaron","Cody","Kyle","Travis","Sean","Patrick",
];
const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Martinez",
  "Anderson","Taylor","Thomas","Hernandez","Moore","Martin","Jackson","Thompson","White","Lopez",
  "Lee","Gonzalez","Harris","Clark","Lewis","Robinson","Walker","Perez","Hall","Young",
  "Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams",
];

const REVIEW_CONTENT: Record<string, { titles: string[]; bodies: string[] }> = {
  "GB-SP-3OZ": {
    titles: [
      "Simple and perfect", "Less is more", "Best S&P jerky I've had",
      "Purist's dream", "Clean ingredients, incredible flavor", "Can't stop snacking",
      "My everyday carry snack", "Surprisingly addictive", "The real deal",
      "Finally, jerky done right"
    ],
    bodies: [
      "I've been eating beef jerky my whole life and this is the first one that tastes like actual beef. The salt and pepper is perfectly balanced — not too much of either. Highly recommend.",
      "Ordered three bags and they were gone in two days. The brisket cut is noticeably different from typical jerky. Tender, thick, and packed with flavor.",
      "I was skeptical about 'just salt and pepper' but wow. The quality of the beef really shines. This is how jerky should taste.",
      "Love that there are only 3 ingredients and I can actually read all of them. Great texture, not too dry, not too chewy.",
      "Got this as a gift and ended up ordering a case. The simplicity is the selling point. You taste the actual beef.",
      "As someone who makes his own jerky, I can tell this is done right. The pepper grind is perfect and the meat quality is top tier.",
      "My go-to snack for hiking. High protein, minimal ingredients, and it actually fills you up. Way better than gas station jerky.",
      "Ordered for my husband who is very particular about jerky. He said it's the best he's ever had. High praise from him.",
      "First order was Salt & Pepper. Now it's on auto-subscribe. The consistency batch to batch is impressive.",
      "Kids love it, I love it, even my picky wife loves it. Just beef, salt, and pepper. Hard to beat.",
    ]
  },
  "GB-SPG-3OZ": {
    titles: [
      "The garlic makes it", "Upgraded classic", "New obsession",
      "Garlic lovers rejoice", "Best beef jerky I've found online", "Addicted",
      "Perfect garlic balance", "One bag is never enough", "Restaurant quality snack",
      "My whole family is hooked"
    ],
    bodies: [
      "The dried fried garlic takes the salt and pepper flavor to a whole new level. It adds a savory depth without being overwhelming. 10/10.",
      "I've gone through 6 bags this month alone. The garlic is noticeable but not overbearing. Perfect with a cold beer.",
      "Bought the salt & pepper first, then the garlic version. Both are great but this one has become my daily driver.",
      "Whoever decided to add fried garlic to a simple jerky recipe is a genius. The texture of the garlic bits adds a nice crunch too.",
      "Every single person I've shared this with has immediately asked where to order. The garlic version is universally loved.",
      "Premium beef, clean simple ingredients, and just the right amount of seasoning. This is the standard all jerky should be judged by.",
      "Not usually a big jerky person but this changed my mind. The garlic flavor is rich and savory. Perfect road trip snack.",
      "Five stars, no question. The quality difference between this and store-bought jerky is night and day.",
      "I'm a chef and I appreciate simple, quality ingredients done well. This is exactly that. Will keep ordering.",
      "Ordered for a fishing trip. Eight guys ate through four bags in one afternoon. Reordered before we even got home.",
    ]
  },
  "GB-SSP-3OZ": {
    titles: [
      "Perfect heat level", "Spicy done right", "My new favorite",
      "Clean heat, great flavor", "Not too hot, not too mild", "Finally a spicy jerky worth eating",
      "Serrano > jalapeño always", "Brings the heat without burning you out", "Fresh spicy flavor",
      "Bold but not overwhelming"
    ],
    bodies: [
      "The serrano pepper gives it a really clean, fresh heat — not the smoky or artificial burn you get from some spicy jerkies. Absolutely fantastic.",
      "I tried the sampler and the Serrano S&P was the first one I finished. The heat builds gradually and pairs perfectly with the beef.",
      "As a spicy food fan I was worried it wouldn't have enough kick. It has the perfect amount — noticeable but not distracting.",
      "Shared with coworkers and everyone wanted the link to order. The serrano flavor is distinct and really delicious.",
      "Love that it's spicy without the heavy seasoning mask. You still taste the quality beef underneath the heat.",
      "Ordered specifically for the heat level. Serrano is such an underrated pepper for jerky. This nailed it.",
      "Finally a spicy jerky that's actually about the flavor, not just trying to destroy your mouth. Well done.",
      "The texture on this one is slightly firmer which I actually like for the spicier version. Great chew.",
      "I add this to my charcuterie boards and everyone fights over it. Incredible flavor pairing with aged cheeses.",
      "My whole order was this flavor. Can't get enough. The heat lingers but isn't unpleasant at all.",
    ]
  },
  "GB-CA-3OZ": {
    titles: [
      "Tastes like a real carne asada", "Blew my mind", "Best flavor in the lineup",
      "The citrus marinade is everything", "Authentic flavors", "This is what jerky can be",
      "Bought 10 bags", "Legitimately incredible", "A new benchmark for jerky",
      "Life changing jerky"
    ],
    bodies: [
      "I grew up in Southern California and this carne asada jerky genuinely tastes like the carne asadas I grew up eating. The lime and orange juice come through perfectly.",
      "Ordered the sampler just to try this one. Bought 8 bags the next day. The cilantro, lime, and cumin combination is exactly right.",
      "This is the best jerky I have ever eaten. Full stop. The citrus marinade on brisket is an absolute masterpiece.",
      "My Mexican coworkers approved of this and they're very picky about carne asada. That's the highest endorsement I can give.",
      "The cumin and citrus combination makes this taste like actual grilled carne asada. Mind-blowing for a jerky.",
      "I brought this to a BBQ and it disappeared in minutes. Everyone kept asking what brand it was. Incredible product.",
      "Every other jerky tastes boring now. The carne asada has completely ruined me for anything else.",
      "The orange juice marinade gives it this beautiful slight sweetness that works perfectly with the cumin. Sophisticated flavor profile.",
      "Five bags in and I have not shared a single one. This is too good to share. The cilantro flavor is spot on.",
      "Reorder every two weeks now. The carne asada is in a completely different league from anything else I've tried.",
    ]
  },
  "GB-BB-3OZ": {
    titles: [
      "BBQ without the guilt", "Monk fruit sweetener done right", "Smoky perfection",
      "Keto-friendly BBQ that actually tastes good", "Can't believe there's no sugar",
      "Best BBQ jerky period", "Sweet, smoky, and clean", "Finally a clean BBQ snack",
      "Smoked paprika MVP", "My keto friends are obsessed"
    ],
    bodies: [
      "I'm on a low sugar diet and I've been searching for a BBQ jerky that doesn't taste like diet food. This is it. You would never guess there's no added sugar.",
      "The smoked paprika and monk fruit sweetener combination is brilliant. Sweet, smoky, and completely clean ingredients.",
      "My kids eat jerky for school lunch and I love that this one has no sugar. They think it's the best BBQ jerky they've ever had.",
      "Tried all five flavors and the Simply Bar-B is my favorite. The sweetness from the monk fruit is subtle and perfect.",
      "As a diabetic I'm always looking for low sugar options that don't sacrifice flavor. This is genuinely the best BBQ jerky I've found.",
      "The dried thyme in this is a subtle touch that really elevates the whole flavor profile. Somebody really thought through this recipe.",
      "Brought to a tailgate. People who had never heard of monk fruit sweetener were completely shocked there was no sugar. Outstanding.",
      "Ordered thinking it would be decent. It's better than any BBQ jerky at any price point I've tried. The smokiness is real.",
      "Sweet and smoky without any of the weird aftertaste you get from artificial sweeteners. The monk fruit is a great choice.",
      "My whole CrossFit gym is now ordering this. High protein, clean ingredients, and the BBQ flavor is legitimately good.",
    ]
  }
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRating(avg: number): number {
  // Generate a rating distribution that produces the target average.
  // Mix of 4s and 5s with occasional 3s.
  const r = Math.random();
  if (avg >= 4.8) return r < 0.80 ? 5 : r < 0.95 ? 4 : 3;
  if (avg >= 4.6) return r < 0.65 ? 5 : r < 0.90 ? 4 : r < 0.97 ? 3 : 2;
  if (avg >= 4.4) return r < 0.50 ? 5 : r < 0.80 ? 4 : r < 0.95 ? 3 : r < 0.99 ? 2 : 1;
  return r < 0.40 ? 5 : r < 0.75 ? 4 : r < 0.93 ? 3 : r < 0.99 ? 2 : 1;
}

function randomDate(daysBack: number): Date {
  const ms = Date.now() - Math.random() * daysBack * 86_400_000;
  return new Date(ms);
}

async function main() {
  const REVIEWS_PER_FLAVOR = 400;

  for (const flavor of FLAVORS) {
    console.log(`Seeding ${REVIEWS_PER_FLAVOR} reviews for ${flavor.name}...`);
    const content = REVIEW_CONTENT[flavor.sku];

    const data = Array.from({ length: REVIEWS_PER_FLAVOR }).map(() => {
      const firstName = pickRandom(FIRST_NAMES);
      const lastName = pickRandom(LAST_NAMES);
      const rating = weightedRating(flavor.avgRating);
      const createdAt = randomDate(730); // spread over last 2 years
      return {
        authorName: `${firstName} ${lastName.charAt(0)}.`,
        authorEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1, 999)}@example.com`,
        flavorSku: flavor.sku,
        rating,
        title: rating >= 4 ? pickRandom(content.titles) : "Good jerky",
        body: pickRandom(content.bodies),
        status: "approved" as const,
        approvedAt: createdAt,
        createdAt,
      };
    });

    await db.review.createMany({ data });

    const created = await db.review.count({ where: { flavorSku: flavor.sku, status: "approved" } });
    const avg = await db.review.aggregate({
      where: { flavorSku: flavor.sku, status: "approved" },
      _avg: { rating: true }
    });
    console.log(`  ✓ ${created} total reviews, avg ${avg._avg.rating?.toFixed(2)} stars`);
  }

  console.log("\nDone. Total reviews:", await db.review.count());
}

main().catch(console.error).finally(() => db.$disconnect());
