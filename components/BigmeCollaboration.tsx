import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { Product } from '../types';

const BIGME_PRODUCTS_SOURCES = [
  '/api/bigme/catalog',
  'https://store.bigme.vip/products.json?limit=250',
] as const;
const USD_TO_INR_RATE = 94.11;

type ShopifyImage = {
  src: string;
};

type ShopifyVariant = {
  available: boolean;
  compare_at_price: string | null;
  price: string;
};

type ShopifyProduct = {
  body_html: string;
  handle: string;
  images: ShopifyImage[];
  product_type: string;
  published_at: string | null;
  tags: string[];
  title: string;
  updated_at: string;
  variants: ShopifyVariant[];
};

type BigmeStoreProduct = {
  available: boolean;
  compareAtPrice: number | null;
  headings: string[];
  handle: string;
  imageCount: number;
  images: string[];
  paragraphs: string[];
  price: number | null;
  productType: string;
  specs: string[];
  summary: string;
  tags: string[];
  title: string;
  updatedAt: string;
};

interface BigmeCollaborationProps {
  onBackToCatalog?: () => void;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onOpenProduct?: (handle: string) => void;
  selectedHandle?: string | null;
}

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

const stripHtml = (html: unknown) =>
  asString(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const decodeHtml = (value: unknown) =>
  asString(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const extractTextByTag = (html: unknown, tagPattern: string) => {
  const source = asString(html);
  if (!source) return [];

  const groupedPattern = `(?:${tagPattern})`;
  return Array.from(
    source.matchAll(new RegExp(`<${groupedPattern}[^>]*>([\\s\\S]*?)<\\/${groupedPattern}>`, 'gi'))
  )
    .map((match) => decodeHtml(stripHtml(match[1])))
    .filter(Boolean);
};

const extractBodyImages = (html: unknown) =>
  Array.from(asString(html).matchAll(/<img[^>]+src=["']([^"']+)["']/gi))
    .map((match) => match[1])
    .filter(Boolean);

const extractSpecLines = (html: string) => {
  const candidates = [
    ...extractTextByTag(html, 'li'),
    ...extractTextByTag(html, 'h3'),
  ];

  return Array.from(
    new Set(
      candidates
        .map((candidate) => candidate.replace(/^[-•\s]+/, '').trim())
        .filter((candidate) => candidate.length >= 6 && candidate.length <= 120)
    )
  );
};

const dedupeImages = (urls: string[]) => Array.from(new Set(urls.filter(Boolean)));

const optimizeImageUrl = (src: string, width: number) => {
  if (!src || src.startsWith('/')) return src;

  try {
    const url = new URL(src);
    if (url.hostname.includes('shopify') || url.hostname.includes('bigme')) {
      url.searchParams.set('width', String(width));
    }
    return url.toString();
  } catch {
    return src;
  }
};

const isUsedProduct = (product: ShopifyProduct) => {
  const haystack = [
    asString(product.title),
    asString(product.handle),
    asString(product.product_type),
    ...((product.tags ?? []).filter((tag): tag is string => typeof tag === 'string')),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes('used') || haystack.includes('second-hand') || haystack.includes('pre-owned');
};

const toBigmeProduct = (product: ShopifyProduct): BigmeStoreProduct => {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variantPrices = variants
    .map((variant) => Number.parseFloat(variant.price))
    .filter((price) => Number.isFinite(price));

  const variantComparePrices = variants
    .map((variant) => (variant.compare_at_price ? Number.parseFloat(variant.compare_at_price) : null))
    .filter((price): price is number => price !== null && Number.isFinite(price));

  const images = dedupeImages([
    ...((Array.isArray(product.images) ? product.images : []).map((image) => image?.src).filter(Boolean) as string[]),
    ...extractBodyImages(product.body_html),
  ]);

  const paragraphs = extractTextByTag(product.body_html, 'p').filter((paragraph) => paragraph.length > 40);
  const headings = extractTextByTag(product.body_html, 'h1|h2|h3');
  const specs = extractSpecLines(product.body_html);
  const summary =
    paragraphs[0] ||
    headings[0] ||
    `${product.product_type || 'Bigme product'} from the official Bigme store.`;

  return {
    available: variants.some((variant) => variant.available),
    compareAtPrice: variantComparePrices.length ? Math.max(...variantComparePrices) : null,
    headings,
    handle: asString(product.handle),
    imageCount: images.length,
    images,
    paragraphs,
    price: variantPrices.length ? Math.min(...variantPrices) : null,
    productType: asString(product.product_type) || 'Bigme Product',
    specs,
    summary,
    tags: (product.tags ?? []).filter((tag): tag is string => typeof tag === 'string'),
    title: asString(product.title) || 'Bigme Product',
    updatedAt: asString(product.updated_at) || new Date().toISOString(),
  };
};

const applyInrMarkup = (baseInrPrice: number) => {
  if (baseInrPrice > 100000) return baseInrPrice + 35000;
  if (baseInrPrice < 2000) return baseInrPrice + 500;
  if (baseInrPrice < 20000) return baseInrPrice + 5000;
  return baseInrPrice + 8000;
};

const convertUsdToInrWithMarkup = (usdPrice: number | null) => {
  if (usdPrice === null) return null;
  return Math.round(applyInrMarkup(usdPrice * USD_TO_INR_RATE));
};

const formatInr = (price: number | null) => {
  const markedUpPrice = convertUsdToInrWithMarkup(price);
  if (markedUpPrice === null) return 'See price on request';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(markedUpPrice);
};

const getInrPrice = (price: number | null) => convertUsdToInrWithMarkup(price);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const buildHighlights = (product: BigmeStoreProduct) =>
  Array.from(
    new Set([
      ...product.headings,
      ...product.tags.filter((tag) => !tag.toLowerCase().includes('spo-')),
      product.productType,
    ])
  ).slice(0, 6);

const CURATED_STORY_BLOCKS: Record<string, { title: string; body: string }[]> = {
  'bigme-hibreak-pro-color-6-e-ink-eye-friendly-smartphone-with-4g-5g-connection': [
    { title: 'Kaleido 3 Color ePaper Display', body: 'The world\'s most advanced color e-ink panel — 300 PPI B/W, 150 PPI color, 52FPS refresh. Read in direct sunlight without any glare or eye strain.' },
    { title: '4G & 5G Connectivity', body: 'Stay fully connected with dual-band 5G support. Stream, call, and browse at full speed while your eyes stay protected from the harsh LCD backlight.' },
    { title: 'Android 14 OS', body: 'Runs the full Android 14 ecosystem. All your apps, your workflow, your life — just without the eye strain that LCD phones cause over long sessions.' },
    { title: 'BLANK × BIGME Partnership', body: 'Exclusively sourced through BLANK\'s India partnership with BIGME. Includes Indian warranty support and our curated onboarding guide for e-ink power users.' },
  ],
  'hibreak-plus-6-13epaper-4g-handwriting-smartphone': [
    { title: '52FPS ePaper — Smooth Like Never Before', body: 'At 52 frames per second, writing and scrolling on this phone feels indistinguishable from paper. The Hibreak Plus redefines what\'s possible on e-ink.' },
    { title: 'Handwriting Recognition Built In', body: 'Take notes directly on the screen with a stylus. Advanced AI converts your handwriting to text in real time — perfect for students, writers, and professionals.' },
    { title: '4G + Android 14OS', body: 'Full LTE connectivity and the latest Android OS. Don\'t compromise on speed or app support to protect your eyes.' },
    { title: '4+64GB Onboard Storage', body: 'Enough room for all your apps, documents, and ebooks. This device is built for people who carry their work everywhere.' },
  ],
  'bigme-b10-10-34g-premium-color-e-paper-digital-tablet-with-android-14os': [
    { title: '10.3\" Premium Color E-Paper', body: 'A massive, color e-ink canvas that\'s gentle on your eyes even during marathon reading or study sessions. Ideal for A4-scale documents and magazines.' },
    { title: '4G Calling + Android 14', body: 'This isn\'t just a reader — it\'s a fully connected productivity machine. Make calls, run apps, and stay productive from anywhere without carrying multiple devices.' },
    { title: 'Built for Deep Work', body: 'The e-ink display naturally reduces the urge to context-switch. Users report significantly higher focus levels compared to LCD tablets.' },
    { title: 'Color Kaleido Display', body: 'Vibrant enough for color PDFs, comics, and diagrams. Gentle enough for 8+ hours of uninterrupted reading without fatigue.' },
  ],
  'bigme-b7-pro-powerful-color-epaper-phone-tablet-8-256gb-with-android-14os-and-4g-calling': [
    { title: '8+256GB — No Compromises', body: 'With 8GB RAM and 256GB storage, the B7 Pro handles multi-window work, large PDF libraries, and demanding apps with ease.' },
    { title: 'Phone + Tablet Hybrid', body: 'Call, message, and run your full workflow on a single device. The B7 Pro eliminates the need to carry both a phone and a tablet.' },
    { title: '4G Calling on E-Ink', body: 'Make crystal-clear calls while enjoying the eye-comfort of e-paper. Rare, powerful, and available through BLANK\'s BIGME partnership.' },
    { title: 'Color ePaper with Android 14', body: 'The Kaleido 3 color display paired with Android 14 means you get a fully modern OS on the most eye-friendly screen technology available today.' },
  ],
  'bigme-b751c-s-upgraded-7inch-color-ereder-with-android-14-os': [
    { title: '7\" Upgraded Color ePaper', body: 'The B751C S is the refined evolution of the B751. Upgraded internals, smoother refresh, and a 150 PPI color display that makes reading a joy.' },
    { title: '300 PPI B/W for Text', body: 'Crisp, razor-sharp monochrome text. Whether you\'re reading novels, academic papers, or code documentation, the clarity rivals a physical book.' },
    { title: 'Android 14 — Full App Support', body: 'Install Kindle, Notion, Google Docs, or any app from the Play Store. The B751C S is the everyday carry device for lifelong learners.' },
    { title: 'Compact & Lightweight', body: 'Slips into any bag, coat pocket, or bedside table. The ideal size for reading in bed without the harsh screen glow that disrupts your sleep.' },
  ],
  'b13-worlds-first-13-3-color-epaper-monitor': [
    { title: 'World\'s First 13.3\" Color ePaper Monitor', body: 'A genuinely unprecedented product. The B13 brings color e-ink to the desktop monitor form factor — zero flicker, zero glare, zero eye strain.' },
    { title: 'Designed for Long Work Sessions', body: 'Coders, writers, researchers, and designers who spend 8+ hours at a desk report dramatically reduced eye fatigue when switching to the B13.' },
    { title: 'Plug-and-Play USB-C', body: 'Connects to any laptop or desktop via USB-C. Works with Mac, Windows, and Linux out of the box with no driver installation required.' },
    { title: 'BLANK × BIGME Exclusive India Import', body: 'The B13 is only available through authorised BIGME partners in India. BLANK handles full import, customs, and in-country support.' },
  ],
  'adjustable-laptop-b13-monitor-extender': [
    { title: 'Designed for the B13 & B-Series', body: 'Engineered specifically to extend BIGME\'s B-series tablets and monitors, giving you a hands-free reading and working angle for any surface.' },
    { title: 'Adjustable Multi-Angle Design', body: 'Fine-tune the tilt from flat to near-vertical. Find your perfect ergonomic reading position to reduce neck and shoulder strain.' },
    { title: 'Solid Build Quality', body: 'Sturdy construction that securely holds your device in place. No wobble, no slip — just reliable support wherever you work.' },
    { title: 'Compact Fold for Travel', body: 'Folds flat in seconds. Slide it into your bag alongside your device and unfold it anywhere — desk, bed, train, or coffee shop.' },
  ],
  'bigme-b6-ai-color-ereader-with-android-14os': [
    { title: 'AI-Powered Reading Experience', body: 'Built-in AI assists with definitions, summaries, and translations. Look up any word or concept without ever leaving your book.' },
    { title: '6\" Kaleido 3 Color Display', body: 'Compact, brilliant, and easy on the eyes. A full-color e-ink reading experience in the most pocketable form factor BIGME has ever made.' },
    { title: 'Android 14 Platform', body: 'Access Kindle, Kobo, Libby, and any other reader app alongside BIGME\'s native reading environment. Your entire library, one device.' },
    { title: 'Long Battery Life', body: 'E-ink\'s fundamental advantage: weeks of battery life per charge. Read without range anxiety, even on long flights or travel.' },
  ],
  'bigme-b7-7-color-epaper-tablet-with-4g-calling': [
    { title: '7\" Color ePaper + 4G Calling', body: 'The perfect size for reading, note-taking, and staying connected. The B7\'s 4G calling makes it a true hybrid between a tablet and a phone.' },
    { title: 'Kaleido 3 Color Panel', body: 'Rich, accurate colors on an e-ink display that never hurts your eyes. Perfect for color comics, illustrated books, and rich PDFs.' },
    { title: 'Android 14 App Ecosystem', body: 'Install and run the apps you already know and love. The B7 doesn\'t lock you into a proprietary ecosystem.' },
    { title: 'BLANK India Warranty', body: 'Sourced through BLANK\'s official BIGME partnership. Full in-country support, no grey-market risk, and a clear warranty process.' },
  ],
  'bigme-f7-7-3-inch-wifi-digital-color-e-ink-picture-frame': [
    { title: '7.3\" Color E-Ink Display', body: 'Unlike LCD frames, the F7\'s e-ink panel consumes near-zero power while displaying your photo. Leave it on permanently without adding to your electricity bill.' },
    { title: 'WiFi Connected', body: 'Push new images to the frame remotely from anywhere in the world. Perfect for sharing family moments with loved ones across distances.' },
    { title: 'Natural, Paper-Like Look', body: 'Photos displayed on e-ink look stunning and natural — exactly like a printed photograph, not a glowing LCD screen.' },
    { title: 'Set It and Forget It', body: 'Charge it once, display your memories for weeks. The F7 is a living, rotating piece of art that requires almost no maintenance.' },
  ],
  'bigme-hibreak-s-4g-color-epaper-smartphone-with-android-14-os': [
    { title: 'Slim 4G e-Ink Smartphone', body: 'The Hibreak S is BIGME\'s entry into the everyday e-ink smartphone. Slim, light, and designed for the user who wants eye comfort without sacrificing connectivity.' },
    { title: 'Color ePaper + Android 14', body: 'A modern Android experience on a display that\'s proven to reduce digital eye strain significantly compared to OLED and LCD alternatives.' },
    { title: 'Full Android App Compatibility', body: 'Every app you rely on — WhatsApp, Gmail, Maps, Spotify — runs on the Hibreak S. E-ink, without the sacrifice.' },
    { title: 'BLANK Curated Onboarding', body: 'When you buy through BLANK, you get our curated e-ink setup guide to tune the device for peak performance out of the box.' },
  ],
  'bigme-b1051-black-and-white-e-ink-smart-tablet-with-300ppi-copy': [
    { title: '300 PPI — Retina-Class B/W Display', body: 'At 300 pixels per inch, the B1051\'s monochrome display renders text so precisely that it genuinely rivals the look of ink on paper.' },
    { title: '10.3\" Professional Canvas', body: 'The Go-To size for A4 PDF annotation, academic reading, and digital note-taking. Large enough to be truly productive on.' },
    { title: 'Smart Tablet Performance', body: 'Powered by a capable processor with enough RAM to run complex apps, multi-page documents, and note-taking software without lag.' },
    { title: '300 PPI for Code & Documents', body: 'Developers and technical writers love the B1051 for reviewing code, documentation, and spec sheets — the high DPI makes dense text perfectly readable.' },
  ],

  'hibreak-pro-phone-case': [
    { title: 'Precision-Fit for Hibreak Pro', body: 'Engineered specifically for the Hibreak Pro\'s dimensions. Every port, button, and the e-ink screen are accessible without removing the case.' },
    { title: 'Drop Protection', body: 'Absorbs impact from everyday drops and bumps — protecting your investment without adding unnecessary bulk.' },
    { title: 'Grip-Optimised Texture', body: 'The tactile surface keeps the phone secure in your hand, reducing accidental drops in the first place.' },
    { title: 'Slim Profile', body: 'Protects without ruining the Hibreak Pro\'s slim aesthetic. Slides in and out of pockets effortlessly.' },
  ],
  'hibreak-pro-flip-fold-protective-case': [
    { title: 'Full-Coverage Flip Protection', body: 'The fold cover shields the e-ink display when the phone is in your pocket or bag — preventing scratches that can ruin the reading experience.' },
    { title: 'Built-In Stand', body: 'Fold the cover back to create a hands-free reading stand. Perfect for reading recipes in the kitchen or watching content on a table.' },
    { title: 'Card Slot', body: 'Carry your essentials without a separate wallet. One daily carry unit for phone, ID, and payment card.' },
    { title: 'Premium Finish', body: 'Quality materials that match the premium feel of the Hibreak Pro itself. This case looks as good as the device it protects.' },
  ],
  'stylus-pen-for-b1051-series': [
    { title: 'Pressure-Sensitive Stylus', body: 'Captures the natural variation in your handwriting — light strokes for thin lines, firm pressure for bold marks. Writing feels organic, not mechanical.' },
    { title: 'Engineered for B1051', body: 'The tip and sensor are precisely calibrated for the B1051\'s digitizer. No parallax, no lag — the ink appears exactly where your stylus touches.' },
    { title: 'Zero Battery Required', body: 'Passive EMR technology means the stylus never needs charging. Pick it up and write, any time, without worrying about power.' },
    { title: 'Perfect for Annotation', body: 'Mark up PDFs, sketch diagrams, sign documents, and take handwritten notes directly on your B1051 screen in a way that feels completely natural.' },
  ],
};

const buildStoryBlocks = (product: BigmeStoreProduct) => {
  // 1. Use curated blocks if available
  const curated = CURATED_STORY_BLOCKS[product.handle];
  if (curated && curated.length > 0) return curated;

  // 2. Try to build from API-parsed headings + paragraphs
  const fromApi = [
    ...product.headings.map((heading, index) => ({
      title: heading,
      body: product.paragraphs[index] || product.paragraphs[0] || product.summary,
    })),
    ...product.paragraphs.slice(1, 4).map((paragraph, index) => ({
      title: `Designed for ${index === 0 ? 'focus' : index === 1 ? 'workflow' : 'everyday carry'}`,
      body: paragraph,
    })),
  ].slice(0, 4);

  if (fromApi.length > 0) return fromApi;

  // 3. Generic intelligent fallback using product metadata
  return [
    {
      title: `${product.productType} by BIGME`,
      body: product.summary,
    },
    {
      title: 'Eye-Friendly Design',
      body: 'E-ink technology eliminates the backlight flicker and blue light emission responsible for digital eye strain. Engineered for people who prioritize long-term eye health.',
    },
    {
      title: 'BLANK × BIGME Partnership',
      body: 'Sourced directly through BLANK\'s official BIGME partnership. Every device ships with verified Indian warranty support and our curated setup guide.',
    },
    {
      title: 'Available in India Through BLANK',
      body: 'BLANK brings the best of BIGME\'s e-ink lineup to India with full import compliance, local warranty, and dedicated customer support.',
    },
  ];
};

const getCollaborationLabel = (product: BigmeStoreProduct) => {
  const haystack = `${product.title} ${product.handle} ${product.tags.join(' ')}`.toLowerCase();
  return haystack.includes('guoyue') ? 'BLANK x GUOYUE' : 'BLANK x BIGME';
};

const getCategory = (product: BigmeStoreProduct) => {
  const text = `${product.title} ${product.productType} ${product.handle} ${product.tags.join(' ')}`.toLowerCase();

  if (text.includes('monitor')) return 'monitors';
  if (text.includes('accessor') || text.includes('case') || text.includes('stylus') || text.includes('pen')) return 'accessories';
  if (text.includes('phone') || text.includes('smartphone') || text.includes('hibreak')) return 'mobiles';
  if (text.includes('tablet') || text.includes('notepad')) return 'tablets';
  if (text.includes('reader') || text.includes('ereader') || text.includes('e-reader') || text.includes('ebook')) return 'readers';
  return 'others';
};

type CategoryFilter = 'all' | 'mobiles' | 'tablets' | 'accessories' | 'monitors' | 'readers' | 'others';
type SortMode = 'newest' | 'price-low-high' | 'price-high-low';

const CATEGORY_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mobiles', label: 'Mobiles' },
  { key: 'tablets', label: 'Tablets' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'monitors', label: 'Monitors' },
  { key: 'readers', label: 'Readers' },
  { key: 'others', label: 'Others' },
];

const fetchCatalogJson = async () => {
  const attempted: string[] = [];

  for (const source of BIGME_PRODUCTS_SOURCES) {
    try {
      attempted.push(source);
      const response = await fetch(source, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      const raw = await response.text();
      const trimmed = raw.trimStart();

      if (!contentType.includes('application/json') && trimmed.startsWith('<!DOCTYPE')) {
        throw new Error('Received HTML instead of JSON');
      }

      const parsed = JSON.parse(raw) as { products?: ShopifyProduct[] };
      if (!Array.isArray(parsed.products)) {
        throw new Error('Missing products array in catalog payload');
      }

      return parsed;
    } catch {
      // Try next source.
    }
  }

  throw new Error(`Unable to load catalog JSON from: ${attempted.join(', ')}`);
};

const OverviewCard: React.FC<{
  onOpenProduct?: (handle: string) => void;
  product: BigmeStoreProduct;
}> = ({ onOpenProduct, product }) => (
  <motion.article
    layout
    className="group overflow-hidden rounded-[2rem] border border-cocoa-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/70"
  >
    <button
      type="button"
      onClick={() => onOpenProduct?.(product.handle)}
      className="block w-full text-left"
    >
      <div className="aspect-[4/3] overflow-hidden flex items-center justify-center p-4">
        {product.images[0] ? (
          <img
            src={optimizeImageUrl(product.images[0], 560)}
            alt={product.title}
            loading="lazy"
            decoding="async"
            width={560}
            height={420}
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 92vw"
            className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-cocoa-500 dark:text-zinc-500">
            No product image
          </div>
        )}
      </div>

      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-400">
          <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300">
            {getCollaborationLabel(product)}
          </span>
          <span className="rounded-full border border-cocoa-300 bg-cocoa-50 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-800/80">
            {product.productType}
          </span>
          <span className="rounded-full border border-cocoa-300 bg-cocoa-50 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-800/80">
            {product.imageCount} images
          </span>
        </div>

        <div>
          <h3 className="text-2xl font-medium leading-tight text-cocoa-950 dark:text-white">
            {product.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cocoa-600 dark:text-zinc-300">
            {product.summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-cocoa-200 bg-cocoa-50 p-4 dark:border-zinc-800 dark:bg-black/20">
            <div className="text-xs uppercase tracking-[0.2em] text-cocoa-500 dark:text-zinc-500">Price</div>
            <div className="mt-1 text-lg font-medium text-cocoa-950 dark:text-white">
              {formatInr(product.price)}
            </div>
          </div>
          <div className="rounded-2xl border border-cocoa-200 bg-cocoa-50 p-4 dark:border-zinc-800 dark:bg-black/20">
            <div className="text-xs uppercase tracking-[0.2em] text-cocoa-500 dark:text-zinc-500">Updated</div>
            <div className="mt-1 text-lg font-medium text-cocoa-950 dark:text-white">
              {formatDate(product.updatedAt)}
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-sm font-medium text-orange-500">
          Explore product <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  </motion.article>
);

const ProductDetailPage: React.FC<{
  onBackToCatalog?: () => void;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  product: BigmeStoreProduct;
}> = ({ onBackToCatalog, onAddToCart, onBuyNow, product }) => {
  const [selectedImage, setSelectedImage] = useState(product.images[0] ?? '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setSelectedImage(product.images[0] ?? '');
    setIsLightboxOpen(false);
  }, [product.handle, product.images]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      const currentIndex = product.images.indexOf(selectedImage);

      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (event.key === 'ArrowRight' && currentIndex >= 0) {
        setSelectedImage(product.images[(currentIndex + 1) % product.images.length]);
      } else if (event.key === 'ArrowLeft' && currentIndex >= 0) {
        setSelectedImage(product.images[(currentIndex - 1 + product.images.length) % product.images.length]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLightboxOpen, product.images, selectedImage]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLightboxOpen]);

  const highlights = buildHighlights(product);
  const storyBlocks = buildStoryBlocks(product);
  const galleryImages = product.images.slice(0, 9);
  const currentImageIndex = Math.max(product.images.indexOf(selectedImage), 0);
  const inrPrice = getInrPrice(product.price);
  const canPurchase = product.available && inrPrice !== null;
  const cartProduct: Product | null = inrPrice === null
    ? null
    : {
        id: product.handle,
        name: product.title,
        price: inrPrice,
        image: product.images[0] ? optimizeImageUrl(product.images[0], 480) : '',
        category: 'gadget',
        description: product.summary,
        note: product.productType,
      };

  const showPreviousImage = () => {
    if (product.images.length === 0) return;
    setSelectedImage(product.images[(currentImageIndex - 1 + product.images.length) % product.images.length]);
  };

  const showNextImage = () => {
    if (product.images.length === 0) return;
    setSelectedImage(product.images[(currentImageIndex + 1) % product.images.length]);
  };

  return (
    <div className="space-y-12 pb-40 md:pb-28">
      <button
        type="button"
        onClick={onBackToCatalog}
        className="inline-flex items-center gap-2 rounded-full border border-cocoa-300 bg-white/90 px-5 py-3 text-sm font-medium text-cocoa-900 shadow-sm transition-colors hover:bg-cocoa-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-white dark:hover:bg-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Bigme collection
      </button>

      <section className="relative overflow-hidden rounded-[2.5rem] border border-cocoa-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(120,53,15,0.08),transparent_34%)]" />
        <div className="grid gap-0 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="min-w-0 border-b border-cocoa-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:border-b-0 lg:border-r">
            <div className="flex min-h-[520px] items-center justify-center overflow-hidden bg-white p-6 md:min-h-[640px] md:p-8 dark:bg-zinc-950">
              {selectedImage ? (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="flex h-full min-w-0 w-full items-center justify-center"
                >
                  <img
                    src={optimizeImageUrl(selectedImage, 1200)}
                    alt={product.title}
                    width={1200}
                    height={900}
                    fetchPriority="high"
                    decoding="async"
                    className="block h-[460px] max-w-full flex-shrink object-contain object-center transition-transform duration-700 hover:scale-[1.02] md:h-[580px] xl:h-[640px]"
                  />
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cocoa-500 dark:text-zinc-500">
                  No product image
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto px-6 pb-6">
                {product.images.map((image) => {
                  const isActive = image === selectedImage;

                  return (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border transition-all ${
                        isActive
                          ? 'border-orange-500 ring-2 ring-orange-500/40'
                          : 'border-cocoa-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                      }`}
                    >
                      <img
                        src={optimizeImageUrl(image, 160)}
                        alt={`${product.title} thumbnail`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="min-w-0 p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-400">
              <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300">
                {getCollaborationLabel(product)}
              </span>
              <span className="rounded-full border border-cocoa-300 bg-cocoa-50 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-800/80">
                {product.productType}
              </span>
              <span className="rounded-full border border-cocoa-300 bg-cocoa-50 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-800/80">
                {product.available ? 'Available now' : 'Currently unavailable'}
              </span>
              <span className="rounded-full border border-cocoa-300 bg-cocoa-50 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-800/80">
                {product.imageCount} images
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-medium leading-tight text-cocoa-950 dark:text-white md:text-5xl">
              {product.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-cocoa-600 dark:text-zinc-300 md:text-lg">
              {product.summary}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                <div className="text-xs uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-500">Price</div>
                <div className="mt-2 text-2xl font-medium text-cocoa-950 dark:text-white">
                  {formatInr(product.price)}
                </div>
              </div>
              <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                <div className="text-xs uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-500">Updated</div>
                <div className="mt-2 text-2xl font-medium text-cocoa-950 dark:text-white">
                  {formatDate(product.updatedAt)}
                </div>
              </div>
              <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                <div className="text-xs uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-500">Collection</div>
                <div className="mt-2 text-2xl font-medium text-cocoa-950 dark:text-white">BIGME x BLANK</div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!canPurchase || !cartProduct}
                onClick={() => cartProduct && onAddToCart?.(cartProduct)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cocoa-300 bg-white px-5 py-3 text-sm font-medium text-cocoa-900 transition-colors hover:bg-cocoa-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Add to Cart
              </button>
              <button
                type="button"
                disabled={!canPurchase || !cartProduct}
                onClick={() => cartProduct && onBuyNow?.(cartProduct)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-cocoa-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-cocoa-950 dark:hover:bg-cocoa-100"
              >
                Buy Now
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {highlights.map((highlight, index) => (
                <div
                  key={`${product.handle}-highlight-${index}`}
                  className="rounded-2xl border border-cocoa-200 bg-white px-4 py-4 text-sm text-cocoa-700 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-200"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[2rem] border border-cocoa-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <h2 className="text-2xl font-medium text-cocoa-950 dark:text-white">Why this product stands out</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {storyBlocks.map((block, index) => (
              <div
                key={`${product.handle}-story-${index}`}
                className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-6 dark:border-zinc-800 dark:bg-black/20"
              >
                <div className="text-xs uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-500">
                  Highlight {index + 1}
                </div>
                <h3 className="mt-3 text-xl font-medium text-cocoa-950 dark:text-white">{block.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cocoa-600 dark:text-zinc-300">{block.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-cocoa-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="mb-6 flex items-center gap-3">
            <Zap className="h-5 w-5 text-orange-500" />
            <h2 className="text-2xl font-medium text-cocoa-950 dark:text-white">Key details</h2>
          </div>
          <div className="space-y-3">
            {product.specs.slice(0, 10).map((spec, index) => (
              <div
                key={`${product.handle}-spec-${index}`}
                className="rounded-2xl border border-cocoa-200 bg-cocoa-50 px-4 py-4 text-sm text-cocoa-700 dark:border-zinc-800 dark:bg-black/20 dark:text-zinc-200"
              >
                {spec}
              </div>
            ))}
            {product.specs.length === 0 && (
              <div className="rounded-2xl border border-cocoa-200 bg-cocoa-50 px-4 py-4 text-sm text-cocoa-600 dark:border-zinc-800 dark:bg-black/20 dark:text-zinc-300">
                Additional spec bullets were not available in the store copy for this product.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-cocoa-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-500">Visual library</div>
            <h2 className="mt-2 text-3xl font-medium text-cocoa-950 dark:text-white">Full product gallery</h2>
          </div>
          <div className="rounded-full border border-cocoa-200 bg-cocoa-50 px-4 py-2 text-sm text-cocoa-700 dark:border-zinc-800 dark:bg-black/20 dark:text-zinc-200">
            {product.imageCount} curated visuals
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {galleryImages.map((image, index) => (
            <button
              key={`${product.handle}-gallery-${index}`}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`overflow-hidden rounded-[1.75rem] border transition-all ${
                image === selectedImage
                  ? 'border-orange-500 ring-2 ring-orange-500/40'
                  : 'border-cocoa-200 dark:border-zinc-800'
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-cocoa-950 dark:bg-zinc-950">
                <img
                  src={optimizeImageUrl(image, 640)}
                  alt={`${product.title} gallery ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                  width={640}
                  height={480}
                  sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 92vw"
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="fixed bottom-20 left-1/2 z-40 w-[min(94vw,760px)] -translate-x-1/2 rounded-2xl border border-cocoa-200 bg-white/92 p-3 shadow-2xl backdrop-blur-md md:bottom-4 dark:border-zinc-700 dark:bg-zinc-900/90">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={!canPurchase || !cartProduct}
            onClick={() => cartProduct && onAddToCart?.(cartProduct)}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-cocoa-300 bg-white px-4 py-3 text-sm font-medium text-cocoa-900 transition-colors hover:bg-cocoa-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Add to Cart
          </button>
          <button
            type="button"
            disabled={!canPurchase || !cartProduct}
            onClick={() => cartProduct && onBuyNow?.(cartProduct)}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-cocoa-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-cocoa-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-cocoa-950 dark:hover:bg-cocoa-100"
          >
            Buy Now
          </button>
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-cocoa-300 bg-white px-4 py-3 text-sm font-medium text-cocoa-900 transition-colors hover:bg-cocoa-50 sm:flex-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Open Gallery
          </button>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isLightboxOpen && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] bg-black/90 backdrop-blur-md"
          >
            <div className="absolute inset-0 overflow-y-auto p-3 md:flex md:items-center md:justify-center md:p-8">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="fixed right-3 top-3 z-20 rounded-full border border-white/20 bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 md:absolute md:right-4 md:top-4 md:p-3"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto flex min-h-full w-full max-w-[980px] flex-col justify-center gap-3 py-12 md:py-4">
                {product.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="fixed left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20 md:absolute md:left-4 md:p-3"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="fixed right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20 md:absolute md:right-4 md:p-3"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  src={optimizeImageUrl(selectedImage, 1400)}
                  width={1400}
                  height={1050}
                  alt={product.title}
                  decoding="async"
                  className="max-h-[58vh] w-full rounded-[1.5rem] bg-white object-contain p-2 shadow-2xl md:max-h-[calc(100vh-220px)] md:max-w-[94vw] md:rounded-[2rem] md:p-4"
                />

                <div className="w-full rounded-[1.25rem] border border-white/20 bg-black/72 p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:rounded-[1.75rem] md:p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/90 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)] md:text-xs md:tracking-[0.24em]">
                        Gallery mode
                      </div>
                      <div className="mt-1 line-clamp-2 text-xl font-medium text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.95)] md:text-lg">
                        {product.title}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 md:gap-3">
                    {product.images.map((image) => (
                      <button
                        key={`${product.handle}-lightbox-${image}`}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border md:h-16 md:w-16 md:rounded-2xl ${
                          image === selectedImage ? 'border-orange-400 ring-2 ring-orange-400/40' : 'border-white/20'
                        }`}
                      >
                        <img
                          src={optimizeImageUrl(image, 120)}
                          alt={`${product.title} preview`}
                          loading="lazy"
                          decoding="async"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

const BigmeCollaboration: React.FC<BigmeCollaborationProps> = ({
  onBackToCatalog,
  onAddToCart,
  onBuyNow,
  onOpenProduct,
  selectedHandle,
}) => {
  const [products, setProducts] = useState<BigmeStoreProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  useEffect(() => {
    let isCancelled = false;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchCatalogJson();
        const mappedProducts = (data.products ?? [])
          .filter((product) => Boolean(product.published_at))
          .filter((product) => !isUsedProduct(product))
          .map(toBigmeProduct)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

        if (!isCancelled) {
          setProducts(mappedProducts);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the live Bigme catalog.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.handle === selectedHandle) ?? null,
    [products, selectedHandle]
  );

  const featuredProducts = products.slice(0, 3);
  const visibleProducts = useMemo(() => {
    const filtered = selectedCategory === 'all'
      ? products
      : products.filter((product) => getCategory(product) === selectedCategory);

    const sorted = [...filtered];
    if (sortMode === 'price-low-high') {
      sorted.sort((a, b) => {
        const left = getInrPrice(a.price) ?? Number.POSITIVE_INFINITY;
        const right = getInrPrice(b.price) ?? Number.POSITIVE_INFINITY;
        return left - right;
      });
    } else if (sortMode === 'price-high-low') {
      sorted.sort((a, b) => {
        const left = getInrPrice(a.price) ?? Number.NEGATIVE_INFINITY;
        const right = getInrPrice(b.price) ?? Number.NEGATIVE_INFINITY;
        return right - left;
      });
    } else {
      sorted.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    }

    return sorted;
  }, [products, selectedCategory, sortMode]);

  return (
    <div className="min-h-screen px-6 pt-28 pb-28 md:pt-32 md:pb-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-orange-500">
            <Zap className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium tracking-wider uppercase">Live Official Store Data</span>
          </div>
          <h1 className="mt-6 text-5xl font-medium tracking-tight text-cocoa-950 dark:text-white md:text-7xl">
            BIGME <span className="text-cocoa-500 dark:text-zinc-500">x</span> BLANK
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-cocoa-600 dark:text-zinc-300">
            A curated Bigme storefront inside BLANK: quick discovery up front, then dedicated product pages
            for the deeper story, richer visuals, and cleaner browsing experience.
          </p>
        </motion.div>

        {isLoading && (
          <div className="flex min-h-[260px] items-center justify-center rounded-[2.5rem] border border-cocoa-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="flex items-center gap-3 text-cocoa-700 dark:text-zinc-300">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              Fetching the latest Bigme products and images...
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/10 p-8 text-center">
            <p className="text-lg text-red-200">Unable to load the live Bigme catalog.</p>
            <p className="mt-2 text-sm text-red-100/70">{error}</p>
          </div>
        )}

        {!isLoading && !error && selectedProduct && (
          <ProductDetailPage
            onBackToCatalog={onBackToCatalog}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
            product={selectedProduct}
          />
        )}

        {!isLoading && !error && !selectedProduct && (
          <div className="space-y-12">
            <section className="overflow-hidden rounded-[2.5rem] border border-cocoa-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="grid gap-0 lg:grid-cols-[1.05fr,0.95fr]">
                <div className="border-b border-cocoa-200 bg-cocoa-950 dark:border-zinc-800 lg:border-b-0 lg:border-r">
                  {featuredProducts[0]?.images[0] ? (
                    <img
                      src={optimizeImageUrl(featuredProducts[0].images[0], 900)}
                      alt={featuredProducts[0].title}
                      width={900}
                      height={900}
                      fetchPriority="high"
                      decoding="async"
                      className="h-full w-full object-contain bg-white p-10 dark:bg-zinc-950"
                    />
                  ) : (
                    <div className="flex h-full min-h-[420px] items-center justify-center text-cocoa-500 dark:text-zinc-500">
                      Bigme hero image loading
                    </div>
                  )}
                </div>

                <div className="p-8 md:p-10">
                  <div className="text-sm text-cocoa-600 dark:text-zinc-300">
                    Less glare. Less scroll-fatigue. More calm, focused screen time.
                  </div>

                  <h2 className="mt-8 text-4xl font-medium leading-tight text-cocoa-950 dark:text-white">
                    E-ink that feels calmer on your eyes and mind.
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-cocoa-600 dark:text-zinc-300">
                    For people spending long hours on screens: e-ink can reduce harsh blue-light exposure, help lower
                    visual strain, and support a smoother evening wind-down before sleep.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                      <Eye className="h-5 w-5 text-orange-500" />
                      <div className="mt-3 text-lg font-medium text-cocoa-950 dark:text-white">Lower eye strain</div>
                      <p className="mt-2 text-sm text-cocoa-600 dark:text-zinc-300">
                        Paper-like contrast with reduced glare for longer reading and work sessions.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                      <ImageIcon className="h-5 w-5 text-orange-500" />
                      <div className="mt-3 text-lg font-medium text-cocoa-950 dark:text-white">Less mental fatigue</div>
                      <p className="mt-2 text-sm text-cocoa-600 dark:text-zinc-300">
                        A distraction-light visual style that helps maintain focus during deep work.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                      <Wifi className="h-5 w-5 text-orange-500" />
                      <div className="mt-3 text-lg font-medium text-cocoa-950 dark:text-white">Better night routine</div>
                      <p className="mt-2 text-sm text-cocoa-600 dark:text-zinc-300">
                        Gentler evening viewing can support healthier sleep timing and recovery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-500">
                    Bigme collection
                  </div>
                  <h2 className="mt-2 text-4xl font-medium text-cocoa-950 dark:text-white">
                    Choose a product to enter its page
                  </h2>
                </div>
                <div className="text-sm text-cocoa-600 dark:text-zinc-400">
                  Accessories, phones, tablets, monitors, and more
                </div>
              </div>

              <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-cocoa-200 bg-cocoa-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((option) => {
                    const isActive = selectedCategory === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSelectedCategory(option.key)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          isActive
                            ? 'border-cocoa-900 bg-cocoa-900 text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-cocoa-300 bg-white text-cocoa-700 hover:border-cocoa-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-cocoa-600 dark:text-zinc-300">
                    Showing {visibleProducts.length} product{visibleProducts.length === 1 ? '' : 's'}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-cocoa-700 dark:text-zinc-300">
                    Sort
                    <select
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value as SortMode)}
                      className="rounded-xl border border-cocoa-300 bg-white px-3 py-2 text-sm text-cocoa-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="newest">Newest</option>
                      <option value="price-low-high">Price: Low to High</option>
                      <option value="price-high-low">Price: High to Low</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {visibleProducts.map((product) => (
                  <OverviewCard
                    key={product.handle}
                    onOpenProduct={onOpenProduct}
                    product={product}
                  />
                ))}
              </div>
              {visibleProducts.length === 0 && (
                <div className="mt-6 rounded-2xl border border-cocoa-200 bg-white p-6 text-center text-cocoa-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
                  No products found in this filter.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default BigmeCollaboration;
