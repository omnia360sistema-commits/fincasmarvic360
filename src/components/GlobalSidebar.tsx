import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import { NAV_ITEMS } from '../constants/navItems';
import { useStability } from '@/stability';
import { isNavTargetActive } from '@/lib/navUrlMatch';

function getActiveRootId(pathname: string, search: string): string | null {
  for (const item of NAV_ITEMS) {
    if (item.children?.length) {
      if (item.children.some(c => isNavTargetActive(pathname, search, c.ruta))) {
        return item.id;
      }
    } else if (item.ruta && isNavTargetActive(pathname, search, item.ruta)) {
      return item.id;
    }
  }
  return null;
}

export default function GlobalSidebar() {
  const { isOpen, toggle, close } = useSidebar();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const { pendingQueueCount, queueErrorCount } = useStability();

  const isDark = theme === 'dark';
  const queueTitle =
    pendingQueueCount > 0
      ? `${pendingQueueCount} envío(s) en cola${queueErrorCount ? ` · ${queueErrorCount} con error` : ''}`
      : '';

  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const id = getActiveRootId(location.pathname, location.search);
    return id ? new Set([id]) : new Set();
  });

  useEffect(() => {
    const activeRoot = getActiveRootId(location.pathname, location.search);
    if (activeRoot) {
      setOpenIds(prev => new Set([...prev, activeRoot]));
    }
    close();
  }, [location.pathname, location.search, close]);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      if (activeItemRef.current && navRef.current) {
        const nav = navRef.current;
        const el = activeItemRef.current;
        const navRect = nav.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const isOutside = elRect.top < navRect.top || elRect.bottom > navRect.bottom;
        if (isOutside) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  const handleRootClick = (item: (typeof NAV_ITEMS)[0]) => {
    if (!item.activo) return;
    if (item.children?.length) {
      setOpenIds(prev => {
        const n = new Set(prev);
        if (n.has(item.id)) n.delete(item.id);
        else n.add(item.id);
        return n;
      });
    } else if (item.ruta) {
      navigate(item.ruta);
      close();
    }
  };

  const handleChevronClick = (e: React.MouseEvent, item: (typeof NAV_ITEMS)[0]) => {
    e.stopPropagation();
    if (!item.activo) return;
    setOpenIds(prev => {
      const n = new Set(prev);
      if (n.has(item.id)) n.delete(item.id);
      else n.add(item.id);
      return n;
    });
  };

  const handleChildClick = (ruta: string) => {
    navigate(ruta);
    close();
  };

  const accent = 'var(--marvic-verde-claro, #40916C)';

  return (
    <>
      <button
        onClick={toggle}
        className={`fixed z-[60] flex items-center justify-center w-10 h-10 rounded-lg
          top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))]
          backdrop-blur-sm border transition-colors duration-200
          ${isDark
            ? 'bg-slate-900/95 hover:bg-slate-800 text-slate-200 border-slate-700'
            : 'bg-slate-100/95 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        title={queueTitle || undefined}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {pendingQueueCount > 0 && (
        <span
          className={`fixed z-[60] pointer-events-none text-[10px] font-bold tabular-nums leading-none px-1.5 py-0.5 rounded
            top-[max(0.75rem,env(safe-area-inset-top))] left-[max(3.25rem,calc(0.75rem+2.5rem+0.25rem+env(safe-area-inset-left)))]
            ${queueErrorCount > 0
              ? isDark
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                : 'bg-amber-100 text-amber-900 border border-amber-400/60'
              : isDark
                ? 'bg-slate-700/80 text-slate-200 border border-slate-600'
                : 'bg-slate-200/95 text-slate-700 border border-slate-400/50'
            }`}
          title={queueTitle}
          aria-live="polite"
        >
          {pendingQueueCount}
        </span>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[70] transition-opacity duration-200"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-72 z-[80] flex flex-col
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isDark
            ? 'bg-slate-950 border-r border-slate-700/80'
            : 'bg-slate-50 border-r border-slate-300'
          }`}
      >
        <div className={`flex items-center justify-between px-4 py-4 border-b shrink-0
          ${isDark ? 'border-slate-700/80' : 'border-slate-300'}`}
        >
          <span className={`text-xs font-semibold tracking-widest uppercase
            ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
          >
            Agrícola Marvic 360
          </span>
          <button
            onClick={close}
            className={`flex items-center justify-center w-8 h-8 rounded transition-colors duration-200
              ${isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav ref={navRef} className="flex-1 overflow-y-auto py-1">
          {NAV_ITEMS.map(item => {
            const hasChildren = !!item.children?.length;
            const isExpanded = openIds.has(item.id);

            const isActive = item.children?.length
              ? item.children.some(c => isNavTargetActive(location.pathname, location.search, c.ruta))
              : item.ruta
                ? isNavTargetActive(location.pathname, location.search, item.ruta)
                : false;

            return (
              <div
                key={item.id}
                ref={isActive ? activeItemRef : undefined}
                className="mb-0.5"
              >
                <button
                  type="button"
                  onClick={() => handleRootClick(item)}
                  disabled={!item.activo}
                  className={`nav-parent w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium
                    transition-all duration-200 ease-in-out border-l-2 border-transparent rounded-md
                    ${!item.activo
                      ? 'opacity-35 cursor-not-allowed'
                      : isActive
                        ? isDark
                          ? 'bg-white/[0.06] text-[color:var(--marvic-verde-suave,#74C69D)]'
                          : 'bg-emerald-900/[0.06] text-emerald-800'
                        : isDark
                          ? 'text-white hover:bg-[rgba(64,145,108,0.15)]'
                          : 'text-slate-800 hover:bg-emerald-900/[0.08]'
                    }`}
                  style={isActive && item.activo ? { borderLeftColor: accent } : undefined}
                >
                  <span
                    className={`flex-1 leading-snug ${!item.activo
                      ? isDark ? 'text-slate-600' : 'text-slate-400'
                      : ''
                    }`}
                  >
                    {item.label}
                  </span>

                  {!item.activo && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                      ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400'}`}
                    >
                      WIP
                    </span>
                  )}

                  {hasChildren && item.activo && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                      onClick={(e) => handleChevronClick(e, item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleChevronClick(e as unknown as React.MouseEvent, item);
                        }
                      }}
                      className={`shrink-0 flex items-center justify-center w-5 h-5 rounded
                        transition-colors duration-150
                        ${isDark
                          ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300'
                          : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ease-in-out
                          ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </span>
                  )}

                  {!hasChildren && isActive && item.activo && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 bg-[color:var(--marvic-verde-claro,#40916C)]"
                    />
                  )}
                </button>

                {hasChildren && isExpanded && (
                  <div
                    className={`ml-3 border-l pl-1
                      ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}
                  >
                    {item.children!.map(child => {
                      const childActive = isNavTargetActive(
                        location.pathname,
                        location.search,
                        child.ruta
                      );

                      return (
                        <button
                          type="button"
                          key={child.id}
                          onClick={() => handleChildClick(child.ruta)}
                          className={`nav-child w-full block text-left text-xs py-2 pl-3 pr-3 rounded
                            transition-all duration-200
                            ${childActive
                              ? isDark
                                ? 'text-[color:var(--marvic-verde-suave,#74C69D)] bg-white/[0.04]'
                                : 'text-emerald-800 bg-emerald-900/[0.06]'
                              : isDark
                                ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                            }`}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`px-4 py-3 border-t text-xs shrink-0
          ${isDark ? 'border-slate-700/80 text-slate-600' : 'border-slate-300 text-slate-400'}`}
        >
          v4.0
        </div>
      </div>
    </>
  );
}
