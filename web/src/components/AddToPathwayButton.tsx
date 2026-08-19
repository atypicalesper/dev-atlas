'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Plus, Route, Sparkles } from 'lucide-react';
import {
  loadPathways,
  savePathways,
  mkPathway,
  mkItem,
  PATHWAY_TEMPLATES,
  mkTemplatePathway,
} from '@/lib/pathway';

interface Props {
  title: string;
  href: string;
}

function hasPage(pathwayHref: string, pageHref: string) {
  return pathwayHref.replace(/^\/+/, '') === pageHref.replace(/^\/+/, '');
}

export default function AddToPathwayButton({ title, href }: Props) {
  const [open, setOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [pathways, setPathways] = useState(() => loadPathways());
  const wrapperRef = useRef<HTMLDivElement>(null);

  const alreadySaved = pathways.some(pathway => pathway.items.some(item => item.href && hasPage(item.href, href)));

  useEffect(() => {
    setPathways(loadPathways());
  }, [open, justAdded]);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function markAdded(label: string) {
    setJustAdded(label);
    setOpen(false);
    window.setTimeout(() => setJustAdded(null), 1800);
  }

  function addToExisting(pathwayId: string) {
    const next = pathways.map(pathway => {
      if (pathway.id !== pathwayId) return pathway;
      if (pathway.items.some(item => item.href && hasPage(item.href, href))) return pathway;
      return { ...pathway, items: [...pathway.items, mkItem(title, href.replace(/^\/+/, ''))] };
    });
    savePathways(next);
    const pathwayName = next.find(pathway => pathway.id === pathwayId)?.name ?? 'Pathway';
    markAdded(pathwayName);
  }

  function createQuickPathway() {
    const next = [...pathways, { ...mkPathway(`${title} Track`), items: [mkItem(title, href.replace(/^\/+/, ''))] }];
    savePathways(next);
    markAdded('New pathway');
  }

  function createFromTemplate(templateId: string) {
    const template = PATHWAY_TEMPLATES.find(entry => entry.id === templateId);
    if (!template) return;
    const pathway = mkTemplatePathway(template);
    if (!pathway.items.some(item => item.href && hasPage(item.href, href))) {
      pathway.items.unshift(mkItem(title, href.replace(/^\/+/, '')));
    }
    savePathways([...pathways, pathway]);
    markAdded(template.name);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: alreadySaved ? 'var(--sidebar-active)' : 'var(--card-bg)',
          color: alreadySaved ? 'var(--sidebar-active-text)' : 'var(--fg)',
        }}
        aria-label={alreadySaved ? 'Saved in pathway' : 'Add to Pathway'}
      >
        {alreadySaved || justAdded ? <Check size={13} /> : <Route size={13} />}
        <span className="hidden sm:inline">
          {justAdded ? `Added to ${justAdded}` : alreadySaved ? 'Saved in pathway' : 'Add to Pathway'}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl border p-3 shadow-2xl"
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', zIndex: 20 }}
        >
          <div className="mb-3">
            <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Save this page</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Drop this doc into an existing pathway or start with a ready-made track.
            </div>
          </div>

          {pathways.length > 0 && (
            <div className="mb-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Existing Pathways
              </div>
              <div className="space-y-1.5">
                {pathways.slice(0, 5).map(pathway => {
                  const exists = pathway.items.some(item => item.href && hasPage(item.href, href));
                  return (
                    <button
                      key={pathway.id}
                      onClick={() => addToExisting(pathway.id)}
                      disabled={exists}
                      className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--sidebar-hover)] disabled:cursor-default disabled:opacity-60"
                      style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                    >
                      <span className="truncate">{pathway.name}</span>
                      <span style={{ color: exists ? 'var(--success)' : 'var(--muted)' }}>
                        {exists ? 'Saved' : `${pathway.items.length} items`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Starter Templates
            </div>
            <div className="space-y-1.5">
              {PATHWAY_TEMPLATES.slice(0, 4).map(template => (
                <button
                  key={template.id}
                  onClick={() => createFromTemplate(template.id)}
                  className="block w-full rounded-xl border px-3 py-2 text-left transition-colors hover:bg-[var(--sidebar-hover)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--fg)' }}>
                    <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                    {template.name}
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={createQuickPathway}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Plus size={12} />
              New Pathway
            </button>
            <Link href="/pathway" className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
              Open pathways
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
