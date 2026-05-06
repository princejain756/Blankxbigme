import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import policyMarkdown from '../warranty&returnpolicy.md?raw';

type PolicyBlock =
  | { type: 'section'; text: string }
  | { type: 'subsection'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string };

const parsePolicyMarkdown = (markdown: string): PolicyBlock[] => {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  const blocks: PolicyBlock[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    blocks.push({ type: 'paragraph', text: paragraphBuffer.join(' ') });
    paragraphBuffer = [];
  };

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      continue;
    }

    if (/^Section\s+/i.test(line)) {
      flushParagraph();
      blocks.push({ type: 'section', text: line });
      continue;
    }

    if (/^\d+(\.\d+)*\s*/.test(line)) {
      flushParagraph();
      blocks.push({ type: 'subsection', text: line });
      continue;
    }

    if (/^●\s*/.test(line)) {
      flushParagraph();
      blocks.push({ type: 'bullet', text: line.replace(/^●\s*/, '') });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return blocks;
};

interface PolicyPageProps {
  onBack?: () => void;
}

const PolicyPage: React.FC<PolicyPageProps> = ({ onBack }) => {
  const blocks = useMemo(() => parsePolicyMarkdown(policyMarkdown), []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-cocoa-300 bg-white/90 px-5 py-3 text-sm font-medium text-cocoa-900 shadow-sm transition-colors hover:bg-cocoa-100 dark:border-cocoa-700 dark:bg-cocoa-900/80 dark:text-white dark:hover:bg-cocoa-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 overflow-hidden rounded-[2.5rem] border border-cocoa-200 bg-white shadow-sm dark:border-cocoa-800 dark:bg-cocoa-900/70"
        >
          <div className="border-b border-cocoa-200 bg-[radial-gradient(circle_at_top_right,rgba(120,53,15,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_35%)] px-8 py-10 dark:border-cocoa-800">
            <div className="inline-flex items-center gap-2 rounded-full border border-cocoa-300 bg-white/70 px-4 py-2 text-cocoa-700 dark:border-cocoa-700 dark:bg-cocoa-950/70 dark:text-cocoa-200">
              <ShieldCheck className="h-4 w-4" />
              Warranty & Return Policy
            </div>
            <h1 className="mt-6 text-4xl font-medium text-cocoa-950 dark:text-white md:text-5xl">
              Warranty, maintenance, and returns
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-cocoa-600 dark:text-cocoa-300">
              Please review the terms below before purchasing or requesting service. This page is based on the
              contents of `warranty&returnpolicy.md`.
            </p>
          </div>

          <div className="space-y-6 px-8 py-10">
            {blocks.map((block, index) => {
              if (block.type === 'section') {
                return (
                  <div key={`${block.type}-${index}`} className="pt-4 first:pt-0">
                    <h2 className="text-2xl font-medium text-cocoa-950 dark:text-white">{block.text}</h2>
                  </div>
                );
              }

              if (block.type === 'subsection') {
                return (
                  <div key={`${block.type}-${index}`} className="pt-2">
                    <h3 className="text-lg font-medium text-cocoa-900 dark:text-cocoa-100">{block.text}</h3>
                  </div>
                );
              }

              if (block.type === 'bullet') {
                return (
                  <div
                    key={`${block.type}-${index}`}
                    className="flex gap-3 rounded-2xl border border-cocoa-200 bg-cocoa-50 px-5 py-4 dark:border-cocoa-800 dark:bg-cocoa-950/60"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    <p className="text-sm leading-relaxed text-cocoa-700 dark:text-cocoa-200">{block.text}</p>
                  </div>
                );
              }

              return (
                <p
                  key={`${block.type}-${index}`}
                  className="text-sm leading-7 text-cocoa-700 dark:text-cocoa-200"
                >
                  {block.text}
                </p>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default PolicyPage;
