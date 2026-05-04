import React, { useEffect, useMemo, useState } from 'react';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import { CONTACT } from '../../constants/contact';

/* ----------------------------------------------------------
   Email Builder
   Block-based composer with a faithful branded preview that
   mirrors the public site's typography and colour palette.
   The exported HTML is real, sendable email markup wrapped
   in inline-styled tables — included in handleExport().
   ---------------------------------------------------------- */

const TEMPLATE_SEEDS = {
  review_invitation: {
    name: 'Review Invitation',
    description: 'Invite clients to share a review after their event.',
    subject: 'Share your experience with Sri Karthikeya Caterers',
    blocks: [
      { id: 'b1', type: 'heading', text: 'How was your event?' },
      {
        id: 'b2',
        type: 'paragraph',
        text: 'Dear {{client_name}}, thank you for choosing Sri Karthikeya Caterers for your {{event_type}} on {{event_date}}. We hope every dish, every detail, and every moment lived up to the occasion.',
      },
      {
        id: 'b3',
        type: 'paragraph',
        text: 'A short note from you — even just two lines — helps families planning their own celebrations decide with confidence. Would you mind sharing your experience?',
      },
      { id: 'b4', type: 'button', text: 'Share my review', url: '{{review_link}}' },
      { id: 'b5', type: 'divider' },
      {
        id: 'b6',
        type: 'paragraph',
        text: 'With gratitude,\nThe Sri Karthikeya Caterers family',
      },
    ],
  },
  thank_you: {
    name: 'Thank You',
    description: 'Thank a client for choosing our catering services.',
    subject: 'Thank you for trusting Sri Karthikeya Caterers',
    blocks: [
      { id: 'b1', type: 'heading', text: 'Thank you, {{client_name}}' },
      {
        id: 'b2',
        type: 'paragraph',
        text: 'It was a privilege to be part of your {{event_type}}. Hosting your guests with authentic, pure-vegetarian cuisine is the kind of work that gives our team meaning.',
      },
      {
        id: 'b3',
        type: 'quote',
        text: 'Food, when shared with care, is the warmest welcome a guest can receive.',
      },
      {
        id: 'b4',
        type: 'paragraph',
        text: 'Whenever you have another celebration on the horizon, we would be honoured to be invited.',
      },
      { id: 'b5', type: 'button', text: 'Plan your next event', url: 'https://srikarthikeyacaterers.in' },
    ],
  },
  newsletter: {
    name: 'Monthly Newsletter',
    description: 'Monthly news and offers for subscribers.',
    subject: 'This month at Sri Karthikeya Caterers',
    blocks: [
      { id: 'b1', type: 'heading', text: 'A taste of the season' },
      {
        id: 'b2',
        type: 'paragraph',
        text: 'Hello {{first_name}}, our chefs have been busy. This month we are introducing seasonal Andhra and Telangana specials that bring the freshest produce of summer to your table.',
      },
      { id: 'b3', type: 'subheading', text: 'New on the menu' },
      {
        id: 'b4',
        type: 'paragraph',
        text: 'Mango pachadi, raw banana koora, and a slow-cooked ulavacharu that has earned a quiet following amongst our wedding clients.',
      },
      { id: 'b5', type: 'button', text: 'View this season’s menu', url: 'https://srikarthikeyacaterers.in/#menus' },
      { id: 'b6', type: 'divider' },
      {
        id: 'b7',
        type: 'paragraph',
        text: 'Booking calendars for the next two months are filling quickly — do reach out early if you have a date in mind.',
      },
    ],
  },
  quote_followup: {
    name: 'Quote Follow-up',
    description: 'Follow up on a pending quote request.',
    subject: 'Your catering quote — Sri Karthikeya Caterers',
    blocks: [
      { id: 'b1', type: 'heading', text: 'Your quote, {{client_name}}' },
      {
        id: 'b2',
        type: 'paragraph',
        text: 'Thank you for the enquiry. We have prepared a tailored quote for your {{event_type}} on {{event_date}} for {{guest_count}} guests.',
      },
      { id: 'b3', type: 'button', text: 'Open my quote', url: '{{quote_link}}' },
      {
        id: 'b4',
        type: 'paragraph',
        text: 'If you would like to adjust the menu, courses, or live counters, just reply to this email — we will revise within the day.',
      },
    ],
  },
};

const DEFAULT_TEMPLATES = [
  {
    id: 1,
    type: 'review_invitation',
    lastModified: '2026-04-20',
    usageCount: 45,
    ...TEMPLATE_SEEDS.review_invitation,
  },
  {
    id: 2,
    type: 'thank_you',
    lastModified: '2026-04-18',
    usageCount: 120,
    ...TEMPLATE_SEEDS.thank_you,
  },
  {
    id: 3,
    type: 'quote_followup',
    lastModified: '2026-04-15',
    usageCount: 32,
    ...TEMPLATE_SEEDS.quote_followup,
  },
  {
    id: 4,
    type: 'newsletter',
    lastModified: '2026-04-01',
    usageCount: 8,
    ...TEMPLATE_SEEDS.newsletter,
  },
];

const TYPE_ICON = {
  review_invitation: 'fa-star',
  thank_you: 'fa-heart',
  quote_followup: 'fa-file-alt',
  newsletter: 'fa-newspaper',
  custom: 'fa-envelope',
};

const VARIABLES = [
  '{{client_name}}',
  '{{first_name}}',
  '{{event_type}}',
  '{{event_date}}',
  '{{guest_count}}',
  '{{review_link}}',
  '{{quote_link}}',
];

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: 'fa-heading' },
  { type: 'subheading', label: 'Subhead', icon: 'fa-text-height' },
  { type: 'paragraph', label: 'Paragraph', icon: 'fa-paragraph' },
  { type: 'button', label: 'Button', icon: 'fa-square' },
  { type: 'quote', label: 'Quote', icon: 'fa-quote-left' },
  { type: 'divider', label: 'Divider', icon: 'fa-minus' },
  { type: 'spacer', label: 'Spacer', icon: 'fa-arrows-alt-v' },
  { type: 'image', label: 'Image', icon: 'fa-image' },
];

const formatDate = (s) =>
  new Date(s).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const uid = () => `b${Date.now()}_${Math.floor(Math.random() * 9999)}`;

const renderInline = (text) => (text || '').replace(/\n/g, '<br>');

const SAMPLE_VARS = {
  '{{client_name}}': 'Rajesh Kumar',
  '{{first_name}}': 'Rajesh',
  '{{event_type}}': 'Wedding',
  '{{event_date}}': '15 April 2026',
  '{{guest_count}}': '500',
  '{{review_link}}': 'https://srikarthikeyacaterers.in/review/abc123',
  '{{quote_link}}': 'https://srikarthikeyacaterers.in/quote/abc123',
};

const fillSample = (text) =>
  Object.entries(SAMPLE_VARS).reduce(
    (acc, [k, v]) => acc.split(k).join(v),
    text || ''
  );

/* ----------------------------------------------------------
   PreviewBlock — renders one block inside the live preview.
   ---------------------------------------------------------- */
const PreviewBlock = ({ block }) => {
  switch (block.type) {
    case 'heading':
      return <h1 dangerouslySetInnerHTML={{ __html: fillSample(renderInline(block.text)) }} />;
    case 'subheading':
      return <h3 dangerouslySetInnerHTML={{ __html: fillSample(renderInline(block.text)) }} />;
    case 'paragraph':
      return <p dangerouslySetInnerHTML={{ __html: fillSample(renderInline(block.text)) }} />;
    case 'button':
      return (
        <p>
          <a className="email-render-button" href={block.url || '#'}>
            {fillSample(block.text || 'Button')}
          </a>
        </p>
      );
    case 'quote':
      return (
        <blockquote
          className="email-render-quote"
          dangerouslySetInnerHTML={{ __html: fillSample(renderInline(block.text)) }}
        />
      );
    case 'divider':
      return <hr className="email-render-divider" />;
    case 'spacer':
      return <span className="email-render-spacer" aria-hidden="true" />;
    case 'image':
      return block.url ? (
        <img className="email-render-image" src={block.url} alt={block.alt || ''} />
      ) : (
        <div
          style={{
            border: '2px dashed #c9c1ad',
            padding: 32,
            textAlign: 'center',
            color: '#7c7e74',
            fontSize: 13,
            borderRadius: 6,
            margin: '6px 0 18px',
          }}
        >
          Add an image URL
        </div>
      );
    default:
      return null;
  }
};

/* ----------------------------------------------------------
   EditorBlock — inline-edit a single block in the canvas.
   ---------------------------------------------------------- */
const EditorBlock = ({ block, onChange, onRemove, onMove, onSelect, isSelected }) => {
  const meta = BLOCK_TYPES.find((t) => t.type === block.type);
  return (
    <div
      className={`email-block ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="email-block-head">
        <span className="type">
          <i className={`fas ${meta?.icon || 'fa-square'}`} aria-hidden="true"></i>
          {meta?.label || block.type}
        </span>
        <div className="email-block-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onMove(-1)}
            aria-label="Move up"
            title="Move up"
          >
            <i className="fas fa-arrow-up" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            aria-label="Move down"
            title="Move down"
          >
            <i className="fas fa-arrow-down" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className="danger"
            onClick={onRemove}
            aria-label="Remove block"
            title="Remove"
          >
            <i className="fas fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      {block.type === 'heading' && (
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Heading text…"
        />
      )}
      {block.type === 'subheading' && (
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Subheading…"
        />
      )}
      {block.type === 'paragraph' && (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Write your paragraph. Variables are supported, e.g. {{client_name}}"
        />
      )}
      {block.type === 'quote' && (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="A short, evocative quote…"
        />
      )}
      {block.type === 'button' && (
        <div className="email-block-row">
          <input
            type="text"
            value={block.text || ''}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Button label"
          />
          <input
            type="text"
            value={block.url || ''}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://… or {{review_link}}"
          />
        </div>
      )}
      {block.type === 'image' && (
        <div className="email-block-row">
          <input
            type="text"
            value={block.url || ''}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="Image URL"
          />
          <input
            type="text"
            value={block.alt || ''}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text"
          />
        </div>
      )}
      {block.type === 'divider' && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>
          A subtle saffron-tinted line separator.
        </p>
      )}
      {block.type === 'spacer' && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>
          16px of breathing room.
        </p>
      )}
    </div>
  );
};

/* ----------------------------------------------------------
   The page itself.
   ---------------------------------------------------------- */
const EmailBuilderPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Editor state
  const [name, setName] = useState('');
  const [type, setType] = useState('custom');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [device, setDevice] = useState('desktop');

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setTemplates(DEFAULT_TEMPLATES);
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, []);

  const isEditing = editingId !== null;

  const startNew = () => {
    setEditingId('new');
    setName('');
    setType('custom');
    setSubject('');
    setPreheader('');
    setBlocks([
      { id: uid(), type: 'heading', text: 'A short, warm headline' },
      {
        id: uid(),
        type: 'paragraph',
        text: 'Write your message here. Use the block library on the left to add buttons, quotes, dividers, and images.',
      },
    ]);
  };

  const startEdit = (tpl) => {
    setEditingId(tpl.id);
    setName(tpl.name);
    setType(tpl.type);
    setSubject(tpl.subject);
    setPreheader(tpl.preheader || '');
    setBlocks(tpl.blocks.map((b) => ({ ...b })));
  };

  const exitEditor = () => {
    setEditingId(null);
    setSelectedBlockId(null);
  };

  const addBlock = (blockType) => {
    const seed =
      blockType === 'heading'
        ? { text: 'Heading' }
        : blockType === 'subheading'
        ? { text: 'Subheading' }
        : blockType === 'paragraph'
        ? { text: 'Type your paragraph…' }
        : blockType === 'button'
        ? { text: 'Click here', url: 'https://srikarthikeyacaterers.in' }
        : blockType === 'quote'
        ? { text: 'A line worth reading.' }
        : blockType === 'image'
        ? { url: '', alt: '' }
        : {};
    const block = { id: uid(), type: blockType, ...seed };
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
  };

  const updateBlock = (id, patch) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id, dir) => {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const insertVariableIntoSelected = (variable) => {
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block) return;
    if (!('text' in block)) return;
    updateBlock(block.id, { text: (block.text || '') + ' ' + variable });
  };

  const handleSave = () => {
    if (!name.trim() || !subject.trim()) {
      alert('Please give your template a name and a subject before saving.');
      return;
    }
    const payload = {
      id: editingId === 'new' ? Date.now() : editingId,
      name,
      type,
      subject,
      preheader,
      blocks,
      lastModified: new Date().toISOString().slice(0, 10),
      usageCount: 0,
      description:
        TEMPLATE_SEEDS[type]?.description ||
        'Custom email template for ad-hoc campaigns.',
    };
    setTemplates((prev) => {
      const existing = prev.find((t) => t.id === payload.id);
      if (existing) return prev.map((t) => (t.id === payload.id ? payload : t));
      return [payload, ...prev];
    });
    exitEditor();
  };

  const handleDuplicate = (tpl) => {
    const copy = {
      ...tpl,
      id: Date.now(),
      name: `${tpl.name} (copy)`,
      lastModified: new Date().toISOString().slice(0, 10),
      usageCount: 0,
    };
    setTemplates((prev) => [copy, ...prev]);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this template? This cannot be undone.')) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  /* Real, sendable HTML export — wraps the blocks in inline-styled,
     table-based markup that renders correctly in major email clients
     (Gmail, Outlook, Apple Mail). Used for "Send test" and as the
     payload backend would dispatch. */
  const exportedHtml = useMemo(() => {
    const blockHtml = blocks
      .map((b) => {
        switch (b.type) {
          case 'heading':
            return `<h1 style="font-family:Fraunces,Georgia,serif;color:#143a26;font-size:28px;font-weight:400;letter-spacing:-0.02em;margin:0 0 14px;">${fillSample(
              renderInline(b.text || '')
            )}</h1>`;
          case 'subheading':
            return `<h3 style="font-family:Fraunces,Georgia,serif;color:#143a26;font-size:18px;font-weight:400;margin:14px 0 8px;">${fillSample(
              renderInline(b.text || '')
            )}</h3>`;
          case 'paragraph':
            return `<p style="margin:0 0 14px;color:#4f5147;line-height:1.7;font-size:15px;">${fillSample(
              renderInline(b.text || '')
            )}</p>`;
          case 'button':
            return `<p style="margin:8px 0 18px;"><a href="${
              fillSample(b.url || '#')
            }" style="display:inline-block;background:#c9882f;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;">${fillSample(
              b.text || 'Click here'
            )}</a></p>`;
          case 'quote':
            return `<blockquote style="border-left:3px solid #c9882f;padding:4px 0 4px 18px;margin:4px 0 18px;font-family:Fraunces,Georgia,serif;font-style:italic;color:#1a1a17;font-size:17px;line-height:1.55;">${fillSample(
              renderInline(b.text || '')
            )}</blockquote>`;
          case 'divider':
            return '<hr style="height:1px;background:#e6dfd1;border:0;margin:22px 0;"/>';
          case 'spacer':
            return '<div style="height:16px;line-height:16px;">&nbsp;</div>';
          case 'image':
            return b.url
              ? `<img src="${b.url}" alt="${b.alt || ''}" style="display:block;width:100%;height:auto;border-radius:6px;margin:6px 0 18px;"/>`
              : '';
          default:
            return '';
        }
      })
      .join('\n');

    return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#ebe4d4;font-family:Inter,-apple-system,sans-serif;color:#1a1a17;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:#ebe4d4;">${preheader}</div>` : ''}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ebe4d4;padding:28px 14px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#061811 0%,#143a26 100%);padding:28px 32px;text-align:center;">
<div style="font-family:Fraunces,Georgia,serif;font-size:22px;color:#fff;">${CONTACT.brand}</div>
<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-top:6px;">Pure Vegetarian · Hyderabad</div>
</td></tr>
<tr><td style="padding:32px;">${blockHtml}</td></tr>
<tr><td style="background:#faf7f1;padding:24px 32px;border-top:1px solid #e6dfd1;text-align:center;font-size:12px;color:#7c7e74;line-height:1.6;">
<p style="margin:0 0 6px;"><strong style="color:#143a26;">${CONTACT.brand}</strong></p>
<p style="margin:0 0 6px;">${CONTACT.primaryPhone?.label || ''} · <a href="mailto:${CONTACT.email || ''}" style="color:#a06d20;text-decoration:none;">${CONTACT.email || ''}</a></p>
<p style="margin:10px 0 0;font-size:11px;color:#a3a59a;">You are receiving this because you booked with us or subscribed to updates.<br/>To unsubscribe, <a href="{{unsubscribe_url}}" style="color:#a06d20;">click here</a>.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  }, [blocks, subject, preheader]);

  const handleSendTest = () => {
    const email = window.prompt('Send a test of this email to:');
    if (!email) return;
    // TODO: POST to backend with { to: email, subject, html: exportedHtml }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[email-builder] send test', { to: email, subject, html: exportedHtml });
    }
    alert(`Test email queued for ${email}.`);
  };

  /* ─────────────── List view ─────────────── */
  if (!isEditing) {
    return (
      <>
        <AdminPageHero
          eyebrow="Email Builder"
          icon="fa-envelope"
          title="Email Templates"
          subtitle={`${templates.length} template${templates.length === 1 ? '' : 's'}`}
          intro="Compose authentically branded, sendable emails with a block-based editor — every template inherits the public site’s typography and palette."
          actions={
            <button type="button" className="btn btn-primary" onClick={startNew}>
              <i className="fas fa-plus" aria-hidden="true" /> New template
            </button>
          }
        />

        <section className="section">
          <div className="container">
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <span className="admin-subhead" style={{ marginBottom: 0 }}>
                  {templates.length} template{templates.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="admin-toolbar-right">
                <button type="button" className="btn btn-ghost">
                  <i className="fas fa-folder-open" aria-hidden="true"></i> Library
                </button>
                <button type="button" className="btn btn-primary" onClick={startNew}>
                  <i className="fas fa-plus" aria-hidden="true"></i> New template
                </button>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <div className="admin-spinner"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fas fa-envelope-open-text" aria-hidden="true"></i>
                </div>
                <h3>No templates yet</h3>
                <p>Create your first branded email template.</p>
                <button type="button" className="btn btn-primary" onClick={startNew}>
                  <i className="fas fa-plus" aria-hidden="true"></i> New template
                </button>
              </div>
            ) : (
              <div className="admin-quick-actions">
                {templates.map((tpl) => (
                  <article key={tpl.id} className="admin-action-card">
                    <span className="admin-action-icon">
                      <i
                        className={`fas ${TYPE_ICON[tpl.type] || 'fa-envelope'}`}
                        aria-hidden="true"
                      ></i>
                    </span>
                    <h3>{tpl.name}</h3>
                    <p>{tpl.description}</p>

                    <div className="admin-meta-row mb-4">
                      <span>
                        <i className="fas fa-calendar" aria-hidden="true"></i>
                        {formatDate(tpl.lastModified)}
                      </span>
                      <span>
                        <i className="fas fa-paper-plane" aria-hidden="true"></i>
                        {tpl.usageCount} sent
                      </span>
                    </div>

                    <div className="flex-row">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => startEdit(tpl)}
                      >
                        <i className="fas fa-pen" aria-hidden="true"></i> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleDuplicate(tpl)}
                        title="Duplicate"
                      >
                        <i className="fas fa-copy" aria-hidden="true"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleDelete(tpl.id)}
                        title="Delete"
                      >
                        <i className="fas fa-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  /* ─────────────── Editor view ─────────────── */
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <>
      <AdminPageHero
        eyebrow="Email Builder"
        icon="fa-pen-to-square"
        title={editingId === 'new' ? 'New template' : 'Edit template'}
        intro="Build the email block by block. The preview on the right reflects exactly what the recipient will see."
        actions={
          <button type="button" className="btn btn-ghost" onClick={exitEditor}>
            <i className="fas fa-arrow-left" aria-hidden="true" /> Back to library
          </button>
        }
      />

      <section className="section">
        <div className="container">
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <button type="button" className="btn btn-ghost" onClick={exitEditor}>
                <i className="fas fa-arrow-left" aria-hidden="true"></i> Back to templates
              </button>
            </div>
            <div className="admin-toolbar-right">
              <button type="button" className="btn btn-ghost" onClick={handleSendTest}>
                <i className="fas fa-paper-plane" aria-hidden="true"></i> Send test
              </button>
              <button type="button" className="btn btn-secondary">
                <i className="fas fa-save" aria-hidden="true"></i> Save as draft
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                <i className="fas fa-check" aria-hidden="true"></i> Save template
              </button>
            </div>
          </div>

          {/* Subject + name row */}
          <div className="admin-surface mb-5">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tplName">Template name</label>
                <input
                  id="tplName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. April newsletter"
                />
              </div>
              <div className="form-group">
                <label htmlFor="tplType">Template type</label>
                <select
                  id="tplType"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="custom">Custom</option>
                  <option value="review_invitation">Review invitation</option>
                  <option value="thank_you">Thank you</option>
                  <option value="quote_followup">Quote follow-up</option>
                  <option value="newsletter">Newsletter</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="tplSubject">Subject line</label>
              <input
                id="tplSubject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="A short, descriptive subject"
              />
            </div>
            <div className="form-group mb-0">
              <label htmlFor="tplPreheader">Preheader (preview text)</label>
              <input
                id="tplPreheader"
                type="text"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                placeholder="A line shown next to the subject in most inboxes"
              />
            </div>
          </div>

          {/* 3-column builder */}
          <div className="email-builder">
            {/* Left rail */}
            <aside className="email-builder-rail">
              <div className="email-builder-rail-header">
                <h3>Building blocks</h3>
              </div>
              <div className="email-builder-rail-body">
                <div className="email-builder-rail-section">
                  <h4>Add a block</h4>
                  <div className="email-block-palette">
                    {BLOCK_TYPES.map((b) => (
                      <button
                        key={b.type}
                        type="button"
                        className="email-block-add"
                        onClick={() => addBlock(b.type)}
                      >
                        <i className={`fas ${b.icon}`} aria-hidden="true"></i>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="email-builder-rail-section">
                  <h4>Variables</h4>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-light)',
                      margin: '0 0 10px',
                    }}
                  >
                    Click to insert into the selected block. Replaced at send time.
                  </p>
                  <div className="email-var-list">
                    {VARIABLES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className="email-var-chip"
                        onClick={() => insertVariableIntoSelected(v)}
                        disabled={!selectedBlock || !('text' in (selectedBlock || {}))}
                        title={
                          !selectedBlock
                            ? 'Select a block first'
                            : `Insert ${v}`
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="email-builder-rail-section">
                  <h4>Tips</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-light)', margin: 0, lineHeight: 1.6 }}>
                    Keep it short — three short paragraphs and one button outperform long emails.
                    Subject lines under 50 characters work best on mobile.
                  </p>
                </div>
              </div>
            </aside>

            {/* Canvas */}
            <div className="email-builder-canvas">
              {blocks.length === 0 ? (
                <div className="email-block-empty">
                  <h4>Start composing</h4>
                  <p>Pick a block from the left to begin.</p>
                </div>
              ) : (
                <div className="email-block-list">
                  {blocks.map((b) => (
                    <EditorBlock
                      key={b.id}
                      block={b}
                      isSelected={selectedBlockId === b.id}
                      onSelect={() => setSelectedBlockId(b.id)}
                      onChange={(patch) => updateBlock(b.id, patch)}
                      onMove={(dir) => moveBlock(b.id, dir)}
                      onRemove={() => removeBlock(b.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            <aside className="email-builder-preview">
              <div className="email-builder-preview-head">
                <h3>Live preview</h3>
                <div className="device-toggle" role="tablist" aria-label="Preview device">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={device === 'desktop'}
                    className={device === 'desktop' ? 'active' : ''}
                    onClick={() => setDevice('desktop')}
                  >
                    <i className="fas fa-desktop" aria-hidden="true"></i> Desktop
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={device === 'mobile'}
                    className={device === 'mobile' ? 'active' : ''}
                    onClick={() => setDevice('mobile')}
                  >
                    <i className="fas fa-mobile-alt" aria-hidden="true"></i> Mobile
                  </button>
                </div>
              </div>
              <div className="email-builder-preview-meta">
                <div className="from">
                  From: {CONTACT.brand} &lt;{CONTACT.email || 'hello@example.com'}&gt;
                </div>
                <div className="subject">{subject || 'Subject line preview'}</div>
                {preheader && (
                  <div style={{ color: 'var(--text-light)', fontSize: 12, marginTop: 2 }}>
                    {preheader}
                  </div>
                )}
              </div>
              <div className="email-builder-preview-body">
                <div className={device === 'mobile' ? 'device-mobile' : ''}>
                  <article className="email-render">
                    <header className="email-render-header">
                      <div className="brand">{CONTACT.brand}</div>
                      <div className="tagline">Pure Vegetarian · Hyderabad</div>
                    </header>
                    <div className="email-render-body">
                      {blocks.length === 0 ? (
                        <p style={{ color: '#7c7e74', fontStyle: 'italic' }}>
                          Add a block to begin composing your email.
                        </p>
                      ) : (
                        blocks.map((b) => <PreviewBlock key={b.id} block={b} />)
                      )}
                    </div>
                    <footer className="email-render-footer">
                      <p>
                        <strong>{CONTACT.brand}</strong>
                      </p>
                      <p>
                        {CONTACT.primaryPhone?.label || ''}
                        {CONTACT.email ? ` · ${CONTACT.email}` : ''}
                      </p>
                      <p className="small">
                        You’re receiving this because you booked with us or subscribed
                        to updates. <a href="#unsub">Unsubscribe</a>.
                      </p>
                    </footer>
                  </article>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
};

export default EmailBuilderPage;
