import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Tag,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

const BIGME_PRODUCTS_URL = 'https://store.bigme.vip/products.json?limit=250';
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

const buildStoryBlocks = (product: BigmeStoreProduct) =>
  [
    ...product.headings.map((heading, index) => ({
      title: heading,
      body: product.paragraphs[index] || product.paragraphs[0] || product.summary,
    })),
    ...product.paragraphs.slice(1, 4).map((paragraph, index) => ({
      title: `Designed for ${index === 0 ? 'focus' : index === 1 ? 'workflow' : 'everyday carry'}`,
      body: paragraph,
    })),
  ].slice(0, 4);

const getCollaborationLabel = (product: BigmeStoreProduct) => {
  const haystack = `${product.title} ${product.handle} ${product.tags.join(' ')}`.toLowerCase();
  return haystack.includes('guoyue') ? 'BLANK x GUOYUE' : 'BLANK x BIGME';
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
      <div className="aspect-[4/3] overflow-hidden bg-cocoa-950 dark:bg-zinc-950">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-contain bg-white p-8 transition-transform duration-700 group-hover:scale-[1.03] dark:bg-zinc-950"
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
  product: BigmeStoreProduct;
}> = ({ onBackToCatalog, product }) => {
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

  const highlights = buildHighlights(product);
  const storyBlocks = buildStoryBlocks(product);
  const galleryImages = product.images.slice(0, 9);
  const currentImageIndex = Math.max(product.images.indexOf(selectedImage), 0);

  const showPreviousImage = () => {
    if (product.images.length === 0) return;
    setSelectedImage(product.images[(currentImageIndex - 1 + product.images.length) % product.images.length]);
  };

  const showNextImage = () => {
    if (product.images.length === 0) return;
    setSelectedImage(product.images[(currentImageIndex + 1) % product.images.length]);
  };

  return (
    <div className="space-y-12">
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
                    src={selectedImage}
                    alt={product.title}
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
                        src={image}
                        alt={`${product.title} thumbnail`}
                        className="h-full w-full object-cover"
                        loading="lazy"
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
              {highlights.map((highlight, index) => (
                <div
                  key={`${product.handle}-highlight-${index}`}
                  className="rounded-2xl border border-cocoa-200 bg-white px-4 py-4 text-sm text-cocoa-700 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-200"
                >
                  {highlight}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-cocoa-500 dark:text-zinc-500">
                    Premium viewing
                  </div>
                  <div className="mt-2 text-lg font-medium text-cocoa-950 dark:text-white">
                    Tap the hero image for immersive gallery mode
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-cocoa-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-cocoa-800 dark:bg-white dark:text-cocoa-950 dark:hover:bg-cocoa-100"
                >
                  Open gallery <ImageIcon className="h-4 w-4" />
                </button>
              </div>
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
                  src={image}
                  alt={`${product.title} gallery ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {isLightboxOpen && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md"
          >
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>

              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
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
                src={selectedImage}
                alt={product.title}
                className="max-h-[82vh] max-w-[88vw] rounded-[2rem] bg-white object-contain p-4 shadow-2xl"
              />

              <div className="absolute bottom-4 left-1/2 w-[min(92vw,900px)] -translate-x-1/2 rounded-[1.75rem] border border-white/20 bg-black/72 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-white/90 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]">
                      Gallery mode
                    </div>
                    <div className="mt-1 text-lg font-medium text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.95)]">
                      {product.title}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
                    {currentImageIndex + 1} / {product.images.length}
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto">
                  {product.images.map((image) => (
                    <button
                      key={`${product.handle}-lightbox-${image}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border ${
                        image === selectedImage ? 'border-orange-400 ring-2 ring-orange-400/40' : 'border-white/20'
                      }`}
                    >
                      <img src={image} alt={`${product.title} preview`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BigmeCollaboration: React.FC<BigmeCollaborationProps> = ({
  onBackToCatalog,
  onOpenProduct,
  selectedHandle,
}) => {
  const [products, setProducts] = useState<BigmeStoreProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(BIGME_PRODUCTS_URL);
        if (!response.ok) {
          throw new Error(`Store request failed with ${response.status}`);
        }

        const data = (await response.json()) as { products?: ShopifyProduct[] };
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

  const totalImages = useMemo(
    () => products.reduce((sum, product) => sum + product.imageCount, 0),
    [products]
  );

  const featuredProducts = products.slice(0, 3);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
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
          <ProductDetailPage onBackToCatalog={onBackToCatalog} product={selectedProduct} />
        )}

        {!isLoading && !error && !selectedProduct && (
          <div className="space-y-12">
            <section className="overflow-hidden rounded-[2.5rem] border border-cocoa-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="grid gap-0 lg:grid-cols-[1.05fr,0.95fr]">
                <div className="border-b border-cocoa-200 bg-cocoa-950 dark:border-zinc-800 lg:border-b-0 lg:border-r">
                  {featuredProducts[0]?.images[0] ? (
                    <img
                      src={featuredProducts[0].images[0]}
                      alt={featuredProducts[0].title}
                      className="h-full w-full object-contain bg-white p-10 dark:bg-zinc-950"
                    />
                  ) : (
                    <div className="flex h-full min-h-[420px] items-center justify-center text-cocoa-500 dark:text-zinc-500">
                      Bigme hero image loading
                    </div>
                  )}
                </div>

                <div className="p-8 md:p-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-full border border-cocoa-300 bg-cocoa-50 px-4 py-2 text-sm text-cocoa-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200">
                      {products.length} official products
                    </div>
                    <div className="rounded-full border border-cocoa-300 bg-cocoa-50 px-4 py-2 text-sm text-cocoa-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200">
                      {totalImages} images discovered
                    </div>
                    <div className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-500">
                      Used products removed
                    </div>
                    <div className="rounded-full border border-cocoa-300 bg-cocoa-50 px-4 py-2 text-sm text-cocoa-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200">
                      INR pricing with BLANK markup
                    </div>
                  </div>

                  <h2 className="mt-8 text-4xl font-medium leading-tight text-cocoa-950 dark:text-white">
                    Beautiful overview first. Dedicated product pages next.
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-cocoa-600 dark:text-zinc-300">
                    Start with a clean collection overview, then open any product into its own immersive page
                    with a full gallery, richer story blocks, and detailed specs extracted from the official Bigme store.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                      <Eye className="h-5 w-5 text-orange-500" />
                      <div className="mt-3 text-lg font-medium text-cocoa-950 dark:text-white">Focused browsing</div>
                      <p className="mt-2 text-sm text-cocoa-600 dark:text-zinc-300">
                        Brief cards in the catalog, deeper detail only when you want it.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                      <ImageIcon className="h-5 w-5 text-orange-500" />
                      <div className="mt-3 text-lg font-medium text-cocoa-950 dark:text-white">Rich galleries</div>
                      <p className="mt-2 text-sm text-cocoa-600 dark:text-zinc-300">
                        Every product page surfaces all available official product visuals.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-cocoa-200 bg-cocoa-50 p-5 dark:border-zinc-800 dark:bg-black/20">
                      <Wifi className="h-5 w-5 text-orange-500" />
                      <div className="mt-3 text-lg font-medium text-cocoa-950 dark:text-white">Live synced data</div>
                      <p className="mt-2 text-sm text-cocoa-600 dark:text-zinc-300">
                        Titles, prices, updates, and imagery stay aligned with the official source.
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

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {products.map((product) => (
                  <OverviewCard
                    key={product.handle}
                    onOpenProduct={onOpenProduct}
                    product={product}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default BigmeCollaboration;
