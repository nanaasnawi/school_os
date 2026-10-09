'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Layers,
  Sparkles,
  Maximize2,
  X,
  Copy,
  Check,
  Printer,
  Clock,
  Compass,
  Lightbulb,
  Tag,
  Share2,
} from 'lucide-react';
import styles from './InfographicMagazineViewer.module.css';

export interface ContentBlock {
  id: string;
  type: 'IMAGE' | 'TEXT';
  content: string;
}

export interface InfographicMagazineViewerProps {
  title: string;
  subtitle?: string;
  subjectName?: string;
  className?: string;
  author?: string;
  blocks: ContentBlock[];
  date?: string;
  onImageRegenerateRequest?: (blockId: string, currentContent: string) => void;
}

interface ParsedCard {
  id: string;
  stepNumber: number;
  headline: string;
  body: string;
  imageUrl?: string;
  takeaway?: string;
}

// Fallback images for educational themes if offline
const EDUCATIONAL_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
];

export function resolveSafeImageUrl(rawContent: string, fallbackIndex = 0, topicHint = ''): string {
  if (!rawContent) {
    const hint = encodeURIComponent((topicHint || 'belajar edukasi kurikulum').trim());
    return `https://image.pollinations.ai/prompt/${hint}%20educational%20magazine%20illustration%20clean%20aesthetic?width=1000&height=600&nologo=true`;
  }

  // Already a valid URL
  if (rawContent.startsWith('http://') || rawContent.startsWith('https://') || rawContent.startsWith('data:image')) {
    return rawContent;
  }

  // Text prompt description - generate real image via Pollinations AI
  const cleanPrompt = rawContent
    .replace(/^gambar\s+(seorang\s+|tentang\s+|dari\s+)?/i, '')
    .replace(/^ilustrasi\s+(tentang\s+|dari\s+)?/i, '')
    .replace(/^close-up\s+/i, '')
    .trim();

  const encoded = encodeURIComponent(`${cleanPrompt} educational illustration colorful clean vector modern`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1000&height=600&nologo=true`;
}

export const InfographicMagazineViewer: React.FC<InfographicMagazineViewerProps> = ({
  title,
  subtitle,
  subjectName = 'Mata Pelajaran',
  className = 'Semua Rombel',
  author = 'Guru Pengampu',
  blocks = [],
  date = 'Edisi Aktif',
}) => {
  const [layoutMode, setLayoutMode] = useState<'MAGAZINE' | 'POSTER'>('MAGAZINE');
  const [activeLightbox, setActiveLightbox] = useState<{ url: string; caption: string } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Parse blocks into Cover Visual, Cards, Did You Know, and Glossary
  const { heroCoverUrl, heroCaption, cards, didYouKnowText, glossaryTerms } = useMemo(() => {
    let coverUrl = '';
    let coverCaption = '';
    const cardList: ParsedCard[] = [];
    let didYouKnow = '';
    const terms = new Set<string>();

    // Normalize block types safely (handles type and block_type)
    const normalized = blocks.map((b: any, idx) => ({
      id: b.id || `norm-${idx}`,
      type: ((b.type || b.block_type || 'TEXT') as string).toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT',
      content: (b.content || '').trim(),
    }));

    // Find first image for hero cover
    const firstImgIdx = normalized.findIndex((b) => b.type === 'IMAGE' && b.content);
    if (firstImgIdx !== -1) {
      coverUrl = resolveSafeImageUrl(normalized[firstImgIdx].content, 0, title);
      coverCaption = `${title} • Edisi Visual Interaktif`;
    } else {
      // Generate default hero cover from title
      coverUrl = resolveSafeImageUrl('', 0, title);
      coverCaption = `${title} • Edisi Visual Interaktif`;
    }

    // Filter out the hero cover block from the subsequent cards if it was at index 0
    const workingBlocks = firstImgIdx === 0 ? normalized.slice(1) : normalized;

    // Pair remaining text and images or parse markdown headlines
    let currentImage = '';
    let cardCount = 1;

    for (let i = 0; i < workingBlocks.length; i++) {
      const b = workingBlocks[i];

      if (b.type === 'IMAGE') {
        currentImage = resolveSafeImageUrl(b.content, cardCount - 1, title);
      } else if (b.type === 'TEXT') {
        const text = b.content;

        // Check if text is a "Tahukah Kamu?" / Fun fact callout
        if (text.toLowerCase().includes('tahukah kamu') || text.toLowerCase().includes('fakta menarik')) {
          didYouKnow = text.replace(/###\s*📌?\s*/g, '').replace(/Tahukah Kamu\??:?/i, '').trim();
        }

        // Extract headline if written like "### 📌 1. Headline\n\nBody"
        let headline = `Poin Penting #${cardCount}`;
        let body = text;
        let step = cardCount;

        const headingMatch = text.match(/^###\s*📌?\s*(\d+)?\.?\s*([^\n]+)/);
        if (headingMatch) {
          if (headingMatch[1]) step = parseInt(headingMatch[1], 10);
          headline = headingMatch[2].trim();
          body = text.replace(headingMatch[0], '').trim();
        } else {
          // If plain paragraph, first sentence as headline if short
          const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
          if (lines.length > 1 && lines[0].length < 80) {
            headline = lines[0].replace(/^[#*-]\s*/, '').trim();
            body = lines.slice(1).join('\n').trim();
          }
        }

        // Collect vocabulary keywords
        const words = headline.split(/\s+/).filter((w: string) => w.length > 5 && !w.startsWith('http'));
        words.slice(0, 2).forEach((w: string) => terms.add(w.replace(/[.,:;?!]/g, '')));

        // Check if this card or previous had an image
        const imgToUse = currentImage || (i + 1 < workingBlocks.length && workingBlocks[i + 1].type === 'IMAGE'
          ? resolveSafeImageUrl(workingBlocks[i + 1].content, cardCount - 1, headline)
          : resolveSafeImageUrl('', cardCount - 1, headline));

        // Consume image if paired forward
        if (!currentImage && i + 1 < workingBlocks.length && workingBlocks[i + 1].type === 'IMAGE') {
          i++; // skip next image as it's paired
        }
        currentImage = '';

        cardList.push({
          id: b.id,
          stepNumber: step,
          headline,
          body,
          imageUrl: imgToUse,
          takeaway: body.length > 120 ? `Intisari: Memahami konsep penting seputar ${headline}.` : undefined,
        });

        cardCount++;
      }
    }

    // Default fallback Did You Know if empty
    if (!didYouKnow) {
      didYouKnow = `Visual ilustrasi pada modul pembelajaran membantu daya ingat siswa hingga 65% lebih kuat dibanding membaca teks polos!`;
    }

    // Default glossary
    if (terms.size === 0) {
      terms.add('Literasi Visual');
      terms.add('Kurikulum Merdeka');
      terms.add('Eksplorasi Konsep');
    }

    return {
      heroCoverUrl: coverUrl,
      heroCaption: coverCaption,
      cards: cardList,
      didYouKnowText: didYouKnow,
      glossaryTerms: Array.from(terms).slice(0, 5),
    };
  }, [blocks, title]);

  const handleCopySummary = () => {
    const allText = [
      `📘 ${title.toUpperCase()}`,
      `Mata Pelajaran: ${subjectName} | Kelas: ${className}`,
      '',
      ...cards.map((c) => `📌 ${c.stepNumber}. ${c.headline}\n${c.body}`),
      '',
      `💡 Tahukah Kamu?\n${didYouKnowText}`,
    ].join('\n\n');

    navigator.clipboard.writeText(allText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.magazineContainer}>
      {/* ── 1. Top Control Bar ── */}
      <div className={styles.topToolbar}>
        <div className={styles.modeToggleGroup}>
          <button
            type="button"
            onClick={() => setLayoutMode('MAGAZINE')}
            className={`${styles.modeBtn} ${layoutMode === 'MAGAZINE' ? styles.modeBtnActive : ''}`}
            title="Tampilan Majalah Interaktif 2-Kolom Bergaya Editorial"
          >
            <BookOpen size={13} />
            <span>Layout Majalah</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('POSTER')}
            className={`${styles.modeBtn} ${layoutMode === 'POSTER' ? styles.modeBtnActive : ''}`}
            title="Tampilan Poster Infografis Vertikal Rangkaian Poin"
          >
            <Layers size={13} />
            <span>Poster Infografis</span>
          </button>
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            onClick={handleCopySummary}
            className={styles.toolBtn}
            title="Salin Seluruh Naskah Materi ke Papan Klip"
          >
            {copiedSuccess ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            <span>{copiedSuccess ? 'Tersalin!' : 'Salin Naskah'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className={styles.toolBtn}
            title="Cetak atau Simpan sebagai PDF"
          >
            <Printer size={12} />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* ── 2. Editorial Masthead (Header Majalah) ── */}
      <header className={styles.masthead}>
        <div className={styles.editionBar}>
          <div className={styles.editionBranding}>
            <span className={styles.editionPill}>EDISI INTERAKTIF</span>
            <span>PKBM DIGITAL MAGAZINE • KURIKULUM MERDEKA</span>
          </div>

          <div className={styles.readTimeBadge}>
            <Clock size={12} />
            <span>Estimasi Baca: ~4 Menit</span>
          </div>
        </div>

        <h1 className={styles.magazineTitle}>{title || 'Petualangan Konsep Pembelajaran'}</h1>

        {subtitle ? (
          <p className={styles.magazineSubtitle}>{subtitle}</p>
        ) : (
          <p className={styles.magazineSubtitle}>
            Modul eksplorasi visual interaktif yang menyajikan ringkasan konsep esensial secara tematis dan mudah dipahami siswa.
          </p>
        )}

        <div className={styles.metaInfoStrip}>
          <span className={`${styles.metaPill} ${styles.metaPillSubject}`}>
            <Compass size={12} />
            <span>{subjectName}</span>
          </span>

          <span className={styles.metaPill}>
            <span>Rombel: {className}</span>
          </span>

          <span className={`${styles.metaPill} ${styles.metaPillAuthor}`}>
            <span>Penyusun: {author}</span>
          </span>

          <span className={styles.metaPill}>
            <span>{date}</span>
          </span>
        </div>
      </header>

      {/* ── 3. Hero Feature Visual Cover ── */}
      {heroCoverUrl && (
        <section className={styles.heroCoverSection}>
          <div
            className={styles.heroCoverFrame}
            onClick={() => setActiveLightbox({ url: heroCoverUrl, caption: heroCaption })}
            title="Klik untuk memperbesar ilustrasi utama"
          >
            <img
              src={heroCoverUrl}
              alt={title}
              className={styles.heroCoverImage}
              onError={(e) => {
                (e.target as HTMLImageElement).src = EDUCATIONAL_FALLBACK_IMAGES[0];
              }}
            />

            <div className={styles.heroOverlayBadge}>
              <Sparkles size={11} color="#facc15" />
              <span>SAMPUL VISUAL UTAMA</span>
            </div>

            <div className={styles.heroCaptionBox}>
              <span className={styles.heroCaptionText}>{heroCaption}</span>
              <div className={styles.zoomHint}>
                <Maximize2 size={11} />
                <span>Perbesar</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4A. MODE 1: MAGAZINE GRID SPREAD (2-Column Alternating) ── */}
      {layoutMode === 'MAGAZINE' && (
        <main className={styles.magazineGrid}>
          {cards.length > 0 ? (
            cards.map((card, idx) => {
              const isInverted = idx % 2 === 1;

              return (
                <article
                  key={card.id || `card-${idx}`}
                  className={`${styles.magazineCard} ${isInverted ? styles.magazineCardInverted : ''}`}
                >
                  {/* Image Column */}
                  {card.imageUrl && (
                    <div
                      className={styles.cardImageCol}
                      onClick={() =>
                        setActiveLightbox({
                          url: card.imageUrl!,
                          caption: `${card.stepNumber}. ${card.headline}`,
                        })
                      }
                      title="Klik untuk memperbesar gambar"
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.headline}
                        className={styles.cardImage}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            EDUCATIONAL_FALLBACK_IMAGES[(idx + 1) % EDUCATIONAL_FALLBACK_IMAGES.length];
                        }}
                      />
                      <div className={styles.cardImageZoomBadge}>
                        <Maximize2 size={10} />
                        <span>Perbesar</span>
                      </div>
                    </div>
                  )}

                  {/* Text Column */}
                  <div className={styles.cardTextCol}>
                    <div className={styles.cardStepHeader}>
                      <span className={styles.stepNumberBadge}>
                        {card.stepNumber < 10 ? `0${card.stepNumber}` : card.stepNumber}
                      </span>
                      <span className={styles.stepCategoryPill}>POIN PEMBELAJARAN</span>
                    </div>

                    <h2 className={styles.cardHeadline}>{card.headline}</h2>
                    <p className={styles.cardBody}>{card.body}</p>

                    {card.takeaway && (
                      <div className={styles.cardTakeaway}>
                        <Lightbulb size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{card.takeaway}</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className={styles.fullWidthTextBlock} style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Belum ada poin kartu infografis. Buat kartu visual melalui Editor Blok atau Generate Otomatis dengan AI.
              </p>
            </div>
          )}
        </main>
      )}

      {/* ── 4B. MODE 2: POSTER INFOGRAFIS (Vertical Connected Roadmap) ── */}
      {layoutMode === 'POSTER' && (
        <main className={styles.posterRoadmap}>
          <div className={styles.roadmapPathLine} />

          {cards.map((card, idx) => (
            <div key={card.id || `poster-${idx}`} className={styles.roadmapStep}>
              <div className={styles.roadmapPin}>
                {card.stepNumber < 10 ? `0${card.stepNumber}` : card.stepNumber}
              </div>

              <div className={styles.roadmapContentCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={styles.stepCategoryPill}>LANGKAH #{card.stepNumber}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Eksplorasi Konsep</span>
                </div>

                <h3 className={styles.cardHeadline} style={{ fontSize: '1.15rem' }}>
                  {card.headline}
                </h3>

                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt={card.headline}
                    className={styles.roadmapImage}
                    onClick={() =>
                      setActiveLightbox({
                        url: card.imageUrl!,
                        caption: `${card.stepNumber}. ${card.headline}`,
                      })
                    }
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        EDUCATIONAL_FALLBACK_IMAGES[(idx + 1) % EDUCATIONAL_FALLBACK_IMAGES.length];
                    }}
                  />
                )}

                <p className={styles.cardBody}>{card.body}</p>
              </div>
            </div>
          ))}
        </main>
      )}

      {/* ── 5. Editorial Footer Callouts (Tahukah Kamu & Glosarium) ── */}
      <footer className={styles.editorialFooterSection}>
        {didYouKnowText && (
          <div className={styles.didYouKnowCard}>
            <div className={styles.didYouKnowIconBox}>
              <Lightbulb size={20} />
            </div>
            <div className={styles.didYouKnowContent}>
              <h4 className={styles.didYouKnowTitle}>Tahukah Kamu? • Fakta Menarik Pembelajaran</h4>
              <p className={styles.didYouKnowText}>{didYouKnowText}</p>
            </div>
          </div>
        )}

        {glossaryTerms.length > 0 && (
          <div className={styles.glossaryStrip}>
            <span className={styles.glossaryLabel}>
              <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Kata Kunci Penting:
            </span>
            <div className={styles.glossaryTags}>
              {glossaryTerms.map((term, i) => (
                <span key={i} className={styles.glossaryTag}>
                  #{term}
                </span>
              ))}
            </div>
          </div>
        )}
      </footer>

      {/* ── 6. Fullscreen Image Lightbox ── */}
      {activeLightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setActiveLightbox(null)}>
          <div className={styles.lightboxBox} onClick={(e) => e.stopPropagation()}>
            <img src={activeLightbox.url} alt="" className={styles.lightboxImg} />
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setActiveLightbox(null)}
              aria-label="Tutup Tampilan Gambar"
            >
              <X size={18} />
            </button>
            {activeLightbox.caption && (
              <div className={styles.lightboxCaption}>{activeLightbox.caption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
