// Single source of truth for the Got Beef catalog.
// Wire this to the DB later — for V1 we ship from this file so prices
// and copy can change without a migration.

export type Flavor = {
  slug: string;
  sku: string;
  name: string;
  shortName: string;
  blurb: string;
  heat: 0 | 1 | 2 | 3; // 0 = mild, 3 = hot
  ingredients: string;
  pdf: string;        // packaging PDF in /outputs
  bagImage: string;   // public path to the SVG bag mockup
};

export const FLAVORS: Flavor[] = [
  {
    slug: "salt-and-pepper",
    sku: "GB-SP-3OZ",
    name: "Salt & Pepper",
    shortName: "Salt & Pepper",
    blurb: "Two ingredients beyond the beef. Salt. Pepper. Done.",
    heat: 0,
    ingredients: "Beef, Ground Pepper, Sea Salt.",
    pdf: "SaltPepper.pdf",
    bagImage: "/images/bags-photo/bag-salt-and-pepper-photo.png"
  },
  {
    slug: "salt-pepper-garlic",
    sku: "GB-SPG-3OZ",
    name: "Salt, Pepper & Garlic",
    shortName: "Salt, Pepper & Garlic",
    blurb: "The classic, with a kick of dried fried garlic.",
    heat: 0,
    ingredients: "Beef, Sea Salt, Dried Fried Garlic, Ground Black Pepper.",
    pdf: "SaltPepperGarlic.pdf",
    bagImage: "/images/bags-photo/bag-salt-pepper-garlic-photo.png"
  },
  {
    slug: "serrano-salt-and-pepper",
    sku: "GB-SSP-3OZ",
    name: "Serrano Salt & Pepper",
    shortName: "Serrano Salt & Pepper",
    blurb: "Serrano pepper powder for clean, fresh heat.",
    heat: 2,
    ingredients: "Beef, Sea Salt, Table Grind Pepper, Serrano Pepper Powder.",
    pdf: "SerranoSaltPepper.pdf",
    bagImage: "/images/bags-photo/bag-serrano-salt-and-pepper-photo.png"
  },
  {
    slug: "carne-asada",
    sku: "GB-CA-3OZ",
    name: "Carne Asada",
    shortName: "Carne Asada",
    blurb: "Citrus-marinated brisket with cumin, cilantro, and lime.",
    heat: 1,
    ingredients:
      "Beef, Orange Juice, Lime Juice, Sea Salt, Granulated Onion, Cilantro, Granulated Garlic, Cumin, Black Pepper, Paprika.",
    pdf: "CarneAsada.pdf",
    bagImage: "/images/bags-photo/bag-carne-asada-photo.png"
  },
  {
    slug: "simply-bar-b",
    sku: "GB-BB-3OZ",
    name: "Simply Bar-B",
    shortName: "Simply Bar-B",
    blurb: "Sweet, smoky BBQ — sweetened with monk fruit, no added sugar.",
    heat: 1,
    ingredients:
      "Beef, Granulated Monk Fruit Sweetener (Allulose, Monk Fruit Extract), Sea Salt, Garlic Powder, Tomato Powder, Onion Powder, Smoked Paprika, Mustard Powder, Dried Thyme, Table Grind Pepper, Cayenne.",
    pdf: "CleanSimplyBar-B.pdf",
    bagImage: "/images/bags-photo/bag-simply-bar-b-photo.png"
  }
];

export const SAMPLER_SKU = "GB-SAMPLER-4";

// Stable lookups
export const flavorBySlug = (slug: string) => FLAVORS.find(f => f.slug === slug);
export const flavorBySku = (sku: string) => FLAVORS.find(f => f.sku === sku);
