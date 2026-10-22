/** Preserve catalogue wording while giving long plain-text descriptions a reading rhythm. */
export function productDescription(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const isLong = normalized.length > 420;
  if (!isLong) return { isLong, intro: normalized, paragraphs: [normalized] };

  const segmenter = new Intl.Segmenter('ro', { granularity: 'sentence' });
  const sentences = Array.from(segmenter.segment(normalized), item => item.segment.trim());
  let intro = '';
  for (const sentence of sentences) {
    if ((intro + ' ' + sentence).trim().length > 280) break;
    intro = (intro + ' ' + sentence).trim();
  }
  if (!intro) {
    const boundary = normalized.lastIndexOf(' ', 260);
    intro = normalized.slice(0, boundary > 0 ? boundary : 260).trimEnd() + '…';
  }

  const paragraphs: string[] = [];
  // Keep editorial paragraph boundaries from the CMS when supplied.
  for (const original of text.trim().split(/\n\s*\n/)) {
    let paragraph = '';
    for (const item of segmenter.segment(original.replace(/\s+/g, ' ').trim())) {
      const sentence = item.segment.trim();
      if (paragraph && (paragraph + ' ' + sentence).length > 430) {
        paragraphs.push(paragraph);
        paragraph = '';
      }
      paragraph = (paragraph + ' ' + sentence).trim();
    }
    if (paragraph) paragraphs.push(paragraph);
  }
  return { isLong, intro, paragraphs };
}
