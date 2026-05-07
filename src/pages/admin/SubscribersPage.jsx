import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import {
  AdminButton,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminLoadingState,
  AdminMetricCard,
  AdminPortal,
  AdminScheduleField,
} from '../../components/admin/shared';
import { CONTACT } from '../../constants/contact';
import { admin as adminApi } from '../../services/api';
import { useToast } from './useToast';
import { browserTimezone, formatScheduleForDisplay } from '../../utils/datetime';

/* ================================================================
   Mock data
   ================================================================ */

const STEPS = [
  { id: 'recipients', label: 'Recipients' },
  { id: 'templates',  label: 'Templates'  },
  { id: 'preview',    label: 'Preview'    },
  { id: 'schedule',   label: 'Send'       },
];

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const firstName = (full) => (full || '').trim().split(/\s+/)[0] || '';

/* ================================================================
   Recipient picker — dual-tab with search + multi-select
   ================================================================ */

const RecipientPicker = ({ selected, onToggle, onAddBulk }) => {
  const [tab, setTab]     = useState('subscriber');
  const [query, setQuery] = useState('');
  const [pool, setPool]   = useState([]);
  const [counts, setCounts] = useState({ clients: 0, subscribers: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .searchRecipients({
        kind: tab === 'subscriber' ? 'subscribers' : 'clients',
        q: query.trim() || undefined,
        page: 0,
        size: 200,
        sortField: 'createdAt',
        sortDir: 'desc',
      })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setPool(items.map((r) => ({
          kind: r.kind,
          id: r.id,
          name: r.name || r.email,
          email: r.email,
          phone: r.phone,
          status: (r.tags || [])[0] || (r.kind === 'subscriber' ? 'website' : 'lead'),
          source: (r.tags || [])[0] || 'website',
          lastEvent: r.lastEventDate || '',
          subscribedAt: r.createdAt,
        })));
        setCounts({
          clients: data?.kindCounts?.clients ?? 0,
          subscribers: data?.kindCounts?.subscribers ?? 0,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPool([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, query]);

  const filtered = pool;

  const selectedKey = (p) => `${p.kind}:${p.id}`;
  const isSelected = (p) => selected.has(selectedKey(p));
  const allOnPageSelected = filtered.length > 0 && filtered.every(isSelected);

  return (
    <div className="cw-picker">
      <div className="cw-picker-head">
        <div className="cw-tabs" role="tablist" aria-label="Recipient kind">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'subscriber'}
            className={`cw-tab${tab === 'subscriber' ? ' active' : ''}`}
            onClick={() => setTab('subscriber')}
          >
            <i className="fas fa-user-friends" aria-hidden="true" /> Subscribers
            <span className="cw-tab-count">{counts.subscribers}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'client'}
            className={`cw-tab${tab === 'client' ? ' active' : ''}`}
            onClick={() => setTab('client')}
          >
            <i className="fas fa-users" aria-hidden="true" /> Clients
            <span className="cw-tab-count">{counts.clients}</span>
          </button>
        </div>
        <label className="admin-search">
          <i className="fas fa-search" aria-hidden="true" />
          <input
            type="search"
            placeholder={`Search ${tab === 'subscriber' ? 'subscribers' : 'clients'} by name or email…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search recipients"
          />
        </label>
      </div>

      <div className="cw-picker-bulk">
        <label className="cw-bulk-label">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={(e) => onAddBulk(filtered, e.target.checked)}
          />
          <span>
            {allOnPageSelected ? 'Deselect all on this view' : 'Select all on this view'}
          </span>
        </label>
        <span className="cw-picker-count">
          {filtered.length} {tab === 'subscriber' ? 'subscriber' : 'client'}
          {filtered.length === 1 ? '' : 's'} shown
        </span>
      </div>

      <ul className="cw-picker-list" role="listbox" aria-label="Recipients">
        {loading && (
          <li className="cw-picker-empty">
            <i className="fas fa-circle-notch fa-spin" aria-hidden="true" /> Loading…
          </li>
        )}
        {!loading && filtered.length === 0 && (
          <li className="cw-picker-empty">No matches.</li>
        )}
        {filtered.map((p) => {
          const sel = isSelected(p);
          return (
            <li key={selectedKey(p)}>
              <label className={`cw-row${sel ? ' selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => onToggle(p)}
                />
                <span className="cw-row-main">
                  <span className="cw-row-name">{p.name}</span>
                  <span className="cw-row-email">{p.email}</span>
                </span>
                <span className="cw-row-meta">
                  {p.kind === 'client' ? (
                    <>
                      <span className={`status-badge ${
                        p.status === 'booked' ? 'booked' :
                        p.status === 'completed' ? 'approved' :
                        p.status === 'quoted' ? 'quoted' : 'pending'
                      }`}>{p.status}</span>
                      {p.lastEvent && <span className="cw-row-extra">Last event {fmtDate(p.lastEvent)}</span>}
                    </>
                  ) : (
                    <>
                      <span className="status-badge active">{p.source}</span>
                      <span className="cw-row-extra">Joined {fmtDate(p.subscribedAt)}</span>
                    </>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/* ================================================================
   Selected pane — chips, removable, deduped count
   ================================================================ */

const SelectedPanel = ({ selected, onRemove, onClear }) => {
  const list = Array.from(selected.values());
  const subs = list.filter((p) => p.kind === 'subscriber');
  const clis = list.filter((p) => p.kind === 'client');
  const uniqueByEmail = new Map();
  list.forEach((p) => uniqueByEmail.set(p.email, p));
  const dedup = list.length - uniqueByEmail.size;

  return (
    <aside className="cw-selected">
      <div className="cw-selected-head">
        <h3>
          Selected
          <span className="cw-selected-num">{list.length}</span>
        </h3>
        {list.length > 0 && (
          <button type="button" className="btn btn-ghost cw-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <div className="cw-selected-stats">
        <div><strong>{subs.length}</strong> subscriber{subs.length === 1 ? '' : 's'}</div>
        <div><strong>{clis.length}</strong> client{clis.length === 1 ? '' : 's'}</div>
        <div className="cw-selected-uniq">
          <strong>{uniqueByEmail.size}</strong> unique email{uniqueByEmail.size === 1 ? '' : 's'}
          {dedup > 0 && <span className="cw-dedup"> · {dedup} merged</span>}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="cw-selected-empty">No one selected yet. Pick from the left.</p>
      ) : (
        <ul className="cw-selected-list">
          {list.map((p) => (
            <li key={`${p.kind}:${p.id}`}>
              <span className="cw-chip">
                <i
                  className={`fas ${p.kind === 'client' ? 'fa-user-tie' : 'fa-user-friends'}`}
                  aria-hidden="true"
                />
                <span className="cw-chip-text">
                  <span className="cw-chip-name">{p.name}</span>
                  <span className="cw-chip-email">{p.email}</span>
                </span>
                <button
                  type="button"
                  className="cw-chip-x"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => onRemove(p)}
                >
                  <i className="fas fa-times" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

/* ================================================================
   Template assignment — 3 modes
   ================================================================ */

const TemplateAssigner = ({
  templates,
  recipients,
  defaultTemplateId, setDefaultTemplateId,
  byKind,            setByKind,
  perRecipient,      setPerRecipient,
  mode,              setMode,
}) => {
  const setPerRow = (key, templateId) => {
    setPerRecipient((prev) => ({ ...prev, [key]: templateId || undefined }));
  };

  return (
    <div className="cw-templates">
      <div className="cw-mode-row" role="tablist" aria-label="Template assignment mode">
        {[
          { id: 'all',      label: 'Same template for everyone',  desc: 'Simplest. One template, every recipient.' },
          { id: 'byKind',   label: 'Per audience type',           desc: 'One template for clients, another for subscribers.' },
          { id: 'perRow',   label: 'Per recipient (override)',    desc: 'Hand-pick a template for any recipient. Falls back to the default for the rest.' },
        ].map((m) => (
          <button
            type="button"
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            className={`cw-mode${mode === m.id ? ' selected' : ''}`}
            onClick={() => setMode(m.id)}
          >
            <span className="cw-mode-radio">{mode === m.id && <i className="fas fa-check" aria-hidden="true" />}</span>
            <span className="cw-mode-text">
              <span className="cw-mode-label">{m.label}</span>
              <span className="cw-mode-desc">{m.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="cw-template-config">
        <div className="form-group">
          <label htmlFor="cw-default">
            Default template <span className="req">*</span>
          </label>
          <select
            id="cw-default"
            value={defaultTemplateId}
            onChange={(e) => setDefaultTemplateId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <small style={{ color: 'var(--text-light)', fontSize: 12 }}>
            Used for any recipient without a more specific assignment.
          </small>
        </div>

        {mode === 'byKind' && (
          <div className="cw-bykind">
            <div className="form-group">
              <label>Subscribers</label>
              <select
                value={byKind.subscriber || defaultTemplateId}
                onChange={(e) => setByKind({ ...byKind, subscriber: e.target.value })}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Clients</label>
              <select
                value={byKind.client || defaultTemplateId}
                onChange={(e) => setByKind({ ...byKind, client: e.target.value })}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {mode === 'perRow' && (
          <div className="cw-perrow">
            <div className="cw-perrow-head">
              <span>Recipient</span>
              <span>Type</span>
              <span>Template (override)</span>
            </div>
            <ul>
              {recipients.map((p) => {
                const k = `${p.kind}:${p.id}`;
                return (
                  <li key={k} className="cw-perrow-row">
                    <span className="cw-perrow-name">
                      <strong>{p.name}</strong>
                      <span>{p.email}</span>
                    </span>
                    <span>
                      <span className={`status-badge ${p.kind === 'client' ? 'booked' : 'active'}`}>
                        {p.kind}
                      </span>
                    </span>
                    <select
                      value={perRecipient[k] || ''}
                      onChange={(e) => setPerRow(k, e.target.value)}
                      aria-label={`Template for ${p.name}`}
                    >
                      <option value="">(use default)</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================
   Per-recipient resolver — what the backend will do
   ================================================================ */

const resolveTemplate = ({ recipient, mode, defaultTemplateId, byKind, perRecipient }) => {
  const key = `${recipient.kind}:${recipient.id}`;
  if (mode === 'perRow' && perRecipient[key]) return perRecipient[key];
  if (mode === 'byKind' && byKind[recipient.kind]) return byKind[recipient.kind];
  return defaultTemplateId;
};

const renderTemplate = (templates, templateId, recipient) => {
  const t = (templates || []).find((x) => x.id === templateId) || (templates || [])[0] || { subject: '', body: '', content: {} };
  
  // Extract template content - prefer content.blocks for structured templates, fallback to content.text or body
  let bodyText = '';
  if (t.content?.blocks && Array.isArray(t.content.blocks)) {
    // Structured template with blocks - extract text from each block
    bodyText = t.content.blocks
      .map(block => {
        if (block.type === 'heading' || block.type === 'subheading') {
          return block.text || '';
        }
        if (block.type === 'paragraph' || block.type === 'quote') {
          return (block.text || '');
        }
        if (block.type === 'button') {
          return `[${block.text || 'Button'}]`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  } else if (t.content?.text) {
    bodyText = t.content.text;
  } else if (t.body) {
    bodyText = t.body;
  } else {
    // Fallback to a generic message if no content found
    bodyText = `Hello {{firstName}},\n\nWe wanted to share a quick update from our kitchen — new seasonal specials are now on the menu, and our wedding calendar for the next two months is filling fast.\n\nWith warmth,\nThe {{brand}} family`;
  }
  
  const variables = {
    brand:        CONTACT.brand,
    firstName:    firstName(recipient.name),
    fullName:     recipient.name,
    clientName:   recipient.name,
    name:         recipient.name,
    email:        recipient.email,
    eventType:    recipient.kind === 'client' ? 'event' : 'season',
    eventDate:    new Date().toLocaleDateString('en-IN'),
    guestCount:   '100',
    reviewLink:   'https://srikarthikeyacaterers.in/review/preview',
    quoteLink:    'https://srikarthikeyacaterers.in/quote/preview',
  };
  
  const apply = (str) => str.replace(/\{\{(\w+)\}\}/g, (_, k) => variables[k] ?? `{{${k}}}`);
  
  return {
    template: t,
    subject:  apply(t.subject || 'Subject preview'),
    body:     apply(bodyText),
  };
};

/* ================================================================
   Branded preview
   ================================================================ */

const CampaignPreview = ({ subject, body, centered }) => {
  const paragraphs = (body || '').split(/\n{2,}/).map((p) => p.replace(/\n/g, '<br>'));
  return (
    <div className="admin-surface" style={{ background: 'var(--color-bg-tertiary)', padding: 24 }}>
      <div className="admin-meta-row mb-4" style={{ justifyContent: 'space-between' }}>
        <span><strong>{CONTACT.brand}</strong> &lt;{CONTACT.email}&gt;</span>
        <span>{new Date().toLocaleDateString('en-IN')}</span>
      </div>
      <div className="mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--color-primary)', letterSpacing: '-0.015em' }}>
        {subject || 'Subject preview'}
      </div>
      <article className="email-render" style={centered ? { margin: '0 auto' } : undefined}>
        <header className="email-render-header">
          <div className="brand">{CONTACT.brand}</div>
          <div className="tagline">Pure Vegetarian · Hyderabad</div>
        </header>
        <div className="email-render-body">
          {paragraphs.map((html, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </div>
        <footer className="email-render-footer">
          <p><strong>{CONTACT.brand}</strong></p>
          <p>{CONTACT.primaryPhone?.label} · {CONTACT.email}</p>
          <p className="small">
            You're receiving this because you booked with us or subscribed to updates. <a href="#unsub">Unsubscribe</a>.
          </p>
        </footer>
      </article>
    </div>
  );
};

/* ================================================================
   Campaign Wizard
   ================================================================ */

const CampaignWizard = ({ initialSelected, onClose }) => {
  /* Selected recipients — keyed Map<"kind:id", recipient> */
  const [selected, setSelected] = useState(() => {
    const m = new Map();
    initialSelected.forEach((p) => m.set(`${p.kind}:${p.id}`, p));
    return m;
  });

  /* Templates loaded from backend */
  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    let cancelled = false;
    adminApi
      .listTemplates({ page: 0, size: 100, sortField: 'updatedAt', sortDir: 'desc' })
      .then((data) => {
        if (cancelled) return;
        const items = (Array.isArray(data?.items) ? data.items : []).map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          body: t.content?.text || '',
        }));
        setTemplates(items);
        // Auto-select first template so the step is immediately valid
        if (items.length > 0) {
          setDefaultTemplateId((prev) => (prev && prev !== '' ? prev : items[0].id));
        }
      })
      .catch(() => { /* surface inline if needed */ });
    return () => { cancelled = true; };
  }, []);

  /* Template assignment */
  const [mode,              setMode]              = useState('all'); // 'all' | 'byKind' | 'perRow'
  const [defaultTemplateId, setDefaultTemplateId] = useState('');
  const [byKind,            setByKind]            = useState({});
  const [perRecipient,      setPerRecipient]      = useState({});

  /* Schedule — `schedule` is the canonical state shape produced by
     AdminScheduleField: { date, time, iso, valid }. The `iso` is what
     we put on the wire; the `date`/`time` round-trip the inputs. */
  const [scheduleMode, setScheduleMode] = useState('now');
  const [schedule, setSchedule] = useState({ date: '', time: '09:00', iso: null, valid: false });

  /* Wizard step */
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex].id;
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [done,    setDone]    = useState(false);

  /* Preview state */
  const recipients = useMemo(() => Array.from(selected.values()), [selected]);
  const [previewKey, setPreviewKey] = useState(null);
  const previewRecipient = useMemo(
    () => (previewKey && selected.get(previewKey)) || recipients[0] || null,
    [previewKey, selected, recipients]
  );

  /* Toggling helpers */
  const toggleOne = (p) => {
    setSelected((prev) => {
      const key = `${p.kind}:${p.id}`;
      const next = new Map(prev);
      if (next.has(key)) next.delete(key); else next.set(key, p);
      return next;
    });
  };
  const addBulk = (list, on) => {
    setSelected((prev) => {
      const next = new Map(prev);
      list.forEach((p) => {
        const key = `${p.kind}:${p.id}`;
        if (on) next.set(key, p); else next.delete(key);
      });
      return next;
    });
  };
  const clearAll = () => setSelected(new Map());

  /* Validation per step */
  const canAdvance = useMemo(() => {
    if (step === 'recipients') return recipients.length > 0;
    if (step === 'templates')  return Boolean(defaultTemplateId);
    if (step === 'schedule')   return scheduleMode === 'now' || schedule.valid;
    return true;
  }, [step, recipients.length, defaultTemplateId, scheduleMode, schedule.valid]);

  /* Render counts for the header summary */
  const { uniqueEmails, kindCounts, overrideCount } = useMemo(() => {
    const seen = new Set();
    let subs = 0, clis = 0, overrides = 0;
    recipients.forEach((r) => {
      seen.add(r.email);
      if (r.kind === 'client')     clis++;
      if (r.kind === 'subscriber') subs++;
      if (mode === 'perRow' && perRecipient[`${r.kind}:${r.id}`]) overrides++;
    });
    return { uniqueEmails: seen.size, kindCounts: { client: clis, subscriber: subs }, overrideCount: overrides };
  }, [recipients, mode, perRecipient]);

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSend = async () => {
    setSending(true);
    setSendError('');
    try {
      // 1) Create draft
      const draft = await adminApi.createCampaign({
        name: `Campaign · ${new Date().toLocaleString('en-IN')}`,
        defaultTemplateId,
        globalVariables: {},
      });
      const campaignId = draft.id;

      // 2) Set recipients (explicit include list, replace mode)
      await adminApi.setCampaignRecipients(campaignId, {
        mode: 'replace',
        include: recipients.map((r) => ({ kind: r.kind, id: r.id })),
      });

      // 3) Assign templates
      if (!defaultTemplateId) {
        throw new Error('No template selected. Please go back and pick a template.');
      }
      const tplBody = { defaultTemplateId };
      if (mode === 'byKind') {
        tplBody.byKindTemplate = byKind;
      }
      if (mode === 'perRow') {
        tplBody.perRecipient = Object.entries(perRecipient)
          .filter(([, v]) => Boolean(v))
          .map(([k, v]) => {
            const colonIdx = k.indexOf(':');
            const kind = k.substring(0, colonIdx);
            const id = k.substring(colonIdx + 1);
            return { kind, id, templateId: v };
          });
      }
      await adminApi.setCampaignTemplates(campaignId, tplBody);

      // 4) Send (immediate or scheduled)
      // CRITICAL: scheduleAt MUST be a UTC ISO 8601 string with timezone
      // suffix (`…Z` or `±HH:MM`). The backend deserialises it as
      // java.time.Instant; a naive `yyyy-mm-ddTHH:mm:ss` either rejects or
      // silently parses as UTC, producing the "scheduled emails never
      // fire" symptom that affected production. AdminScheduleField always
      // emits a proper ISO via `.iso`, computed from the local inputs.
      if (scheduleMode === 'scheduled' && !schedule.valid) {
        throw new Error('Pick a valid future date and time before scheduling.');
      }
      const scheduleAt = scheduleMode === 'scheduled' ? schedule.iso : null;
      await adminApi.sendCampaign(campaignId, {
        scheduleAt,
        // Audit-only: the server stores this in system_logs so post-mortems
        // can correlate dispatch lateness with the admin's local timezone.
        timezone: scheduleMode === 'scheduled' ? browserTimezone() : undefined,
      });

      setSending(false);
      setDone(true);
      setTimeout(() => onClose(true), 1800);
    } catch (err) {
      setSending(false);
      setSendError(err?.message || 'Could not send the campaign.');
    }
  };

  if (done) {
    return (
      <AdminPortal>
        <div className="bulk-wizard">
          <div className="bulk-wizard-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="admin-success-state" style={{ maxWidth: 520 }}>
              <div className="admin-success-icon">
                <i className="fas fa-check-circle" aria-hidden="true" />
              </div>
              <h3>{scheduleMode === 'now' ? 'Campaign queued for sending' : 'Campaign scheduled'}</h3>
              <p>
                {scheduleMode === 'now'
                  ? `Your email is dispatching to ${uniqueEmails.toLocaleString('en-IN')} recipient${uniqueEmails === 1 ? '' : 's'}. Track progress on the Campaigns page.`
                  : `Your email will go out ${formatScheduleForDisplay(schedule.iso)}. Cancel any time from the Campaigns page.`}
              </p>
            </div>
          </div>
        </div>
      </AdminPortal>
    );
  }

  return (
    <AdminPortal>
    <div className="bulk-wizard cw" role="dialog" aria-label="Email campaign wizard">
      <div className="bulk-wizard-bar">
        <h2>Email campaign</h2>
        <ol className="bulk-wizard-stepper" aria-label="Progress">
          {STEPS.map((s, i) => {
            const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending';
            return (
              <React.Fragment key={s.id}>
                <li className={`bulk-wizard-step ${state}`}>
                  <span className="dot">
                    {state === 'done' ? <i className="fas fa-check" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className="label">{s.label}</span>
                </li>
                {i < STEPS.length - 1 && <span className="line" aria-hidden="true" />}
              </React.Fragment>
            );
          })}
        </ol>
        <button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>
          <i className="fas fa-times" aria-hidden="true" /> Close
        </button>
      </div>

      <div className="bulk-wizard-body">
        {/* STEP 1 — Recipients */}
        {step === 'recipients' && (
          <div className="cw-grid">
            <RecipientPicker
              selected={selected}
              onToggle={toggleOne}
              onAddBulk={addBulk}
            />
            <SelectedPanel
              selected={selected}
              onRemove={toggleOne}
              onClear={clearAll}
            />
          </div>
        )}

        {/* STEP 2 — Templates */}
        {step === 'templates' && (
          <div className="wizard-1col">
            <div className="admin-section-head">
              <div>
                <h2>Assign templates</h2>
                <p>
                  Pick how every email should be composed. Choose one template for everyone,
                  one per audience type, or override per recipient.
                </p>
              </div>
            </div>
            <TemplateAssigner
              recipients={recipients}
              templates={templates}
              defaultTemplateId={defaultTemplateId} setDefaultTemplateId={setDefaultTemplateId}
              byKind={byKind}                       setByKind={setByKind}
              perRecipient={perRecipient}           setPerRecipient={setPerRecipient}
              mode={mode}                           setMode={setMode}
            />
          </div>
        )}

        {/* STEP 3 — Preview */}
        {step === 'preview' && !previewRecipient && (
          <div className="admin-empty-state">
            <i className="fas fa-inbox" aria-hidden="true" />
            <h3>No recipients to preview</h3>
            <p>Go back and pick at least one recipient to see how the email will render.</p>
            <button type="button" className="btn btn-ghost" onClick={() => setStepIndex(0)}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> Back to recipients
            </button>
          </div>
        )}
        {step === 'preview' && previewRecipient && (
          <div className="cw-preview-grid">
            <aside className="cw-preview-list">
              <h3>Preview as</h3>
              <ul>
                {recipients.map((r) => {
                  const key = `${r.kind}:${r.id}`;
                  const isActive = previewKey ? key === previewKey : r === recipients[0];
                  const tplId = resolveTemplate({ recipient: r, mode, defaultTemplateId, byKind, perRecipient });
                  const tpl = templates.find((t) => t.id === tplId);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        className={`cw-preview-item${isActive ? ' active' : ''}`}
                        onClick={() => setPreviewKey(key)}
                      >
                        <span className="cw-preview-who">
                          <strong>{r.name}</strong>
                          <span>{r.email}</span>
                        </span>
                        <span className="cw-preview-tpl">
                          <i className={`fas ${tpl?.icon || 'fa-envelope'}`} aria-hidden="true" /> {tpl?.name || 'Default'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <div className="cw-preview-canvas">
              {(() => {
                const tplId = resolveTemplate({ recipient: previewRecipient, mode, defaultTemplateId, byKind, perRecipient });
                const { subject, body, template } = renderTemplate(templates, tplId, previewRecipient);
                return (
                  <>
                    <div className="cw-preview-meta">
                      <span><strong>To:</strong> {previewRecipient.name} &lt;{previewRecipient.email}&gt;</span>
                      <span><strong>Template:</strong> {template.name}</span>
                    </div>
                    <CampaignPreview subject={subject} body={body} centered />
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* STEP 4 — Schedule */}
        {step === 'schedule' && (
          <div className="wizard-1col">
            <div className="admin-section-head">
              <div>
                <h2>When should we send?</h2>
                <p>Send immediately, or schedule for later.</p>
              </div>
            </div>

            <div className="schedule-options">
              <button
                type="button"
                className={`schedule-option${scheduleMode === 'now' ? ' selected' : ''}`}
                onClick={() => setScheduleMode('now')}
              >
                <span className="label">
                  <i className="fas fa-paper-plane" aria-hidden="true" /> Send now
                </span>
                <span className="desc">The email goes out as soon as you confirm.</span>
              </button>
              <button
                type="button"
                className={`schedule-option${scheduleMode === 'scheduled' ? ' selected' : ''}`}
                onClick={() => setScheduleMode('scheduled')}
              >
                <span className="label">
                  <i className="fas fa-clock" aria-hidden="true" /> Schedule for later
                </span>
                <span className="desc">Pick a date and time — we'll dispatch on schedule.</span>
              </button>
            </div>

            {scheduleMode === 'scheduled' && (
              <div className="admin-surface mb-5">
                <AdminScheduleField
                  value={{ date: schedule.date, time: schedule.time }}
                  onChange={setSchedule}
                  minLeadMinutes={1}
                />
              </div>
            )}

            <div className="send-summary">
              <h3>You're about to send</h3>
              <dl>
                <div className="row">
                  <dt>Recipients</dt>
                  <dd>
                    <strong style={{ color: 'var(--color-accent-dark)' }}>
                      {uniqueEmails.toLocaleString('en-IN')}
                    </strong>{' '}
                    unique · {kindCounts.subscriber} subscribers · {kindCounts.client} clients
                  </dd>
                </div>
                <div className="row">
                  <dt>Templates</dt>
                  <dd>
                    {mode === 'all'    && `Same template for everyone — ${templates.find((t) => t.id === defaultTemplateId)?.name}`}
                    {mode === 'byKind' && (
                      <>
                        Per audience —{' '}
                        <span>{templates.find((t) => t.id === (byKind.subscriber || defaultTemplateId))?.name}</span>{' '}
                        for subscribers ·{' '}
                        <span>{templates.find((t) => t.id === (byKind.client || defaultTemplateId))?.name}</span>{' '}
                        for clients
                      </>
                    )}
                    {mode === 'perRow' && `Default + ${overrideCount} per-recipient override${overrideCount === 1 ? '' : 's'}`}
                  </dd>
                </div>
                <div className="row">
                  <dt>From</dt>
                  <dd>{CONTACT.brand} &lt;{CONTACT.email}&gt;</dd>
                </div>
                <div className="row">
                  <dt>Send</dt>
                  <dd>
                    {scheduleMode === 'now'
                      ? 'Immediately'
                      : schedule.iso
                      ? formatScheduleForDisplay(schedule.iso)
                      : 'Pick a date and time'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>

      <div className="bulk-wizard-foot">
        <div className="summary">
          <strong>{uniqueEmails.toLocaleString('en-IN')}</strong> recipient
          {uniqueEmails === 1 ? '' : 's'} · {STEPS[stepIndex].label} ({stepIndex + 1}/{STEPS.length})
          {sendError && (
            <div className="form-error" role="alert" style={{ marginTop: 8 }}>
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {sendError}
            </div>
          )}
        </div>
        <div className="flex-row">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={stepIndex === 0 ? () => onClose(false) : goBack}
          >
            <i className={`fas ${stepIndex === 0 ? 'fa-times' : 'fa-arrow-left'}`} aria-hidden="true" />
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={goNext} disabled={!canAdvance}>
              Continue <i className="fas fa-arrow-right" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-accent btn-lg"
              onClick={handleSend}
              disabled={!canAdvance || sending}
            >
              {sending ? (
                <>
                  <i className="fas fa-spinner fa-spin" aria-hidden="true" /> {scheduleMode === 'now' ? 'Sending…' : 'Scheduling…'}
                </>
              ) : (
                <>
                  <i className={`fas ${scheduleMode === 'now' ? 'fa-paper-plane' : 'fa-clock'}`} aria-hidden="true" />{' '}
                  {scheduleMode === 'now' ? 'Send now' : 'Schedule'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
    </AdminPortal>
  );
};

/* ================================================================
   The page
   ================================================================ */

const SOURCE_BADGE = {
  website: { label: 'Website',  className: 'featured' },
  event:   { label: 'Event',    className: 'approved' },
  referral:{ label: 'Referral', className: 'active'   },
};

const SubscribersPage = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [campaignStats, setCampaignStats] = useState({ sent: 0, scheduled: 0 });
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState('');
  const [selected,    setSelected]    = useState([]); // ids of subscribers (for quick-launch wizard)
  const [showWizard,  setShowWizard]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirm, setConfirm] = useState(null); // { kind: 'delete' | 'unsubscribe' | 'bulkUnsub', id, email }
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { toast } = useToast();

  const reload = useCallback(() => {
    setLoading(true);
    /* Load subscribers, total client count, and real campaign stats in
       parallel. Campaign counts replace the previously hard-coded
       "8 sent / 42% open rate" placeholders that were misleading admins. */
    return Promise.all([
      adminApi.listSubscribers({ page: 0, size: 200, sortField: 'createdAt', sortDir: 'desc' }),
      adminApi.listClients({ page: 0, size: 1, sortField: 'createdAt', sortDir: 'desc' }),
      adminApi.listCampaigns({ page: 0, size: 1, status: 'sent' }).catch(() => ({ total: 0 })),
      adminApi.listCampaigns({ page: 0, size: 1, status: 'queued' }).catch(() => ({ total: 0 })),
    ])
      .then(([subscribersData, clientsData, sentData, queuedData]) => {
        const items = Array.isArray(subscribersData?.items) ? subscribersData.items : [];
        setSubscribers(
          items.map((s) => ({
            id: s.id,
            email: s.email,
            name: s.name || '',
            source: (s.source || 'website').toLowerCase(),
            subscribedAt: s.createdAt,
            status: s.isActive ? 'active' : 'inactive',
            isActive: s.isActive,
          }))
        );
        setClientsCount(clientsData?.total || 0);
        setCampaignStats({
          sent: sentData?.total ?? 0,
          scheduled: queuedData?.total ?? 0,
        });
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = subscribers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.email.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
  });

  const handleSelectAll = (e) => {
    setSelected(e.target.checked ? filtered.map((s) => s.id) : []);
  };
  const toggleSubscriber = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleCloseWizard = (sent) => {
    setShowWizard(false);
    if (sent) setSelected([]);
  };

  const performAction = useCallback(async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.kind === 'unsubscribe') {
        await adminApi.unsubscribe(confirm.id);
        toast.success('Subscriber unsubscribed.');
      } else if (confirm.kind === 'delete') {
        await adminApi.deleteSubscriber(confirm.id);
        toast.success('Subscriber deleted.');
      } else if (confirm.kind === 'bulkUnsub') {
        const ids = confirm.ids || [];
        const results = await Promise.allSettled(ids.map((id) => adminApi.unsubscribe(id)));
        const okCount = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.length - okCount;
        if (failed === 0) {
          toast.success(`Unsubscribed ${okCount} subscriber${okCount === 1 ? '' : 's'}.`);
        } else {
          toast.warning(`${okCount} unsubscribed · ${failed} failed.`);
        }
        setSelected([]);
      }
      setConfirm(null);
      await reload();
    } catch (err) {
      toast.error(err?.message || 'Action failed.');
    } finally {
      setConfirmLoading(false);
    }
  }, [confirm, reload, toast]);

  /* CSV export — lightweight, runs entirely in the browser. */
  const exportCsv = useCallback(() => {
    const headers = ['Email', 'Name', 'Source', 'Status', 'Subscribed'];
    const rows = filtered.map((s) => [
      s.email,
      s.name || '',
      s.source,
      s.isActive ? 'active' : 'unsubscribed',
      fmtDate(s.subscribedAt),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} subscribers.`);
  }, [filtered, toast]);

  const initialSelected = useMemo(
    () => subscribers.filter((s) => selected.includes(s.id)),
    [subscribers, selected]
  );

  const stats = useMemo(
    () => ({
      total:     subscribers.length,
      active:    subscribers.filter((s) => s.isActive).length,
      campaigns: campaignStats.sent,
      scheduled: campaignStats.scheduled,
    }),
    [subscribers, campaignStats]
  );

  return (
    <>
      <AdminPageHero
        eyebrow="Email Campaigns"
        icon="fa-paper-plane"
        title="Email campaigns"
        subtitle={`${stats.total.toLocaleString('en-IN')} subscribers · ${stats.active.toLocaleString('en-IN')} active · ${clientsCount} clients reachable`}
        intro="Manage your subscriber list and launch email campaigns from here. Pick recipients from subscribers and clients, assign templates, preview, and schedule or send."
        actions={
          <AdminButton
            variant="primary"
            icon="fa-paper-plane"
            onClick={() => setShowWizard(true)}
          >
            New campaign{selected.length > 0 ? ` (${selected.length})` : ''}
          </AdminButton>
        }
      />

      <section className="section">
        <div className="container">
          <div className="admin-metric-grid">
            <AdminMetricCard
              label="Subscribers"
              value={stats.total}
              tone="primary"
              icon="fa-user-friends"
              hint={stats.active === stats.total ? 'all active' : `${stats.active} active`}
              loading={loading}
              delay={0}
            />
            <AdminMetricCard
              label="Clients reachable"
              value={clientsCount}
              tone="info"
              icon="fa-users"
              hint="From client list"
              loading={loading}
              delay={80}
            />
            <AdminMetricCard
              label="Campaigns sent"
              value={stats.campaigns}
              tone="success"
              icon="fa-paper-plane"
              hint="All time"
              loading={loading}
              delay={160}
            />
            <AdminMetricCard
              label="Scheduled"
              value={stats.scheduled}
              tone={stats.scheduled > 0 ? 'warning' : 'neutral'}
              icon="fa-clock"
              hint={stats.scheduled > 0 ? 'Awaiting dispatch' : 'None scheduled'}
              loading={loading}
              delay={240}
            />
          </div>

          {loadError && (
            <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {loadError}
              <button type="button" className="btn-link" style={{ marginLeft: 12 }} onClick={reload}>
                Retry
              </button>
            </div>
          )}

          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <label className="admin-search">
                <i className="fas fa-search" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search subscribers by name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search subscribers"
                />
              </label>
            </div>
            <div className="admin-toolbar-right">
              <AdminButton
                variant="ghost"
                icon="fa-download"
                onClick={exportCsv}
                disabled={filtered.length === 0}
              >
                Export CSV
              </AdminButton>
            </div>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">
                Subscribers
                {filtered.length !== subscribers.length && (
                  <span className="admin-cell-sub" style={{ marginLeft: 8, fontWeight: 400 }}>
                    ({filtered.length} matching)
                  </span>
                )}
              </h3>
              <div className="admin-table-actions">
                {selected.length > 0 && (
                  <>
                    <AdminButton
                      variant="primary"
                      icon="fa-paper-plane"
                      onClick={() => setShowWizard(true)}
                    >
                      Email selected ({selected.length})
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      icon="fa-ban"
                      onClick={() =>
                        setConfirm({
                          kind: 'bulkUnsub',
                          ids: selected.filter((id) =>
                            subscribers.find((s) => s.id === id && s.isActive)
                          ),
                        })
                      }
                    >
                      Unsubscribe selected
                    </AdminButton>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <AdminLoadingState variant="skeleton" rows={6} />
            ) : filtered.length === 0 ? (
              <AdminEmptyState
                icon="fa-user-friends"
                title="No subscribers found"
                description={
                  searchQuery
                    ? 'Try adjusting your search.'
                    : 'No subscribers yet — they appear once people sign up.'
                }
              />
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selected.length === filtered.length && filtered.length > 0}
                        aria-label="Select all"
                      />
                    </th>
                    <th>Subscriber</th>
                    <th>Source</th>
                    <th>Subscribed</th>
                    <th>Status</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const badge = SOURCE_BADGE[s.source] || { label: s.source, className: 'pending' };
                    return (
                      <tr key={s.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.includes(s.id)}
                            onChange={() => toggleSubscriber(s.id)}
                            aria-label={`Select ${s.name || s.email}`}
                          />
                        </td>
                        <td>
                          <div className="admin-cell-title">{s.name || s.email}</div>
                          <div className="admin-cell-sub">{s.email}</div>
                        </td>
                        <td><span className={`status-badge ${badge.className}`}>{badge.label}</span></td>
                        <td className="admin-cell-sub">{fmtDate(s.subscribedAt)}</td>
                        <td>
                          {s.isActive ? (
                            <span className="status-badge approved"><i className="fas fa-check" /> active</span>
                          ) : (
                            <span className="status-badge declined"><i className="fas fa-ban" /> unsubscribed</span>
                          )}
                        </td>
                        <td>
                          {s.isActive && (
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setConfirm({ kind: 'unsubscribe', id: s.id, email: s.email })
                              }
                            >
                              Unsubscribe
                            </AdminButton>
                          )}
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            icon="fa-trash"
                            ariaLabel={`Delete ${s.email}`}
                            onClick={() => setConfirm({ kind: 'delete', id: s.id, email: s.email })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {showWizard && (
        <CampaignWizard
          initialSelected={initialSelected}
          onClose={handleCloseWizard}
        />
      )}

      <AdminConfirmDialog
        open={!!confirm}
        title={
          confirm?.kind === 'delete'
            ? 'Delete subscriber?'
            : confirm?.kind === 'bulkUnsub'
            ? 'Unsubscribe selected?'
            : 'Unsubscribe this subscriber?'
        }
        description={
          confirm?.kind === 'delete'
            ? `${confirm?.email} will be permanently removed. This cannot be undone.`
            : confirm?.kind === 'bulkUnsub'
            ? `${(confirm?.ids || []).length} subscriber${
                (confirm?.ids || []).length === 1 ? '' : 's'
              } will stop receiving campaign emails. They can re-subscribe via the website.`
            : `${confirm?.email} will stop receiving campaign emails. They can re-subscribe via the website.`
        }
        confirmLabel={
          confirm?.kind === 'delete'
            ? 'Delete subscriber'
            : confirm?.kind === 'bulkUnsub'
            ? `Unsubscribe ${(confirm?.ids || []).length}`
            : 'Unsubscribe'
        }
        tone={confirm?.kind === 'delete' ? 'danger' : 'primary'}
        loading={confirmLoading}
        onConfirm={performAction}
        onCancel={() => !confirmLoading && setConfirm(null)}
      />
    </>
  );
};

export default SubscribersPage;
