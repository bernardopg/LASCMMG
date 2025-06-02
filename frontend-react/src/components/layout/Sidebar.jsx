import { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronDown, FaStar } from 'react-icons/fa';
import { menuSections } from '../../config/sidebarConfig';
import { useAuth } from '../../context/AuthContext';

const SidebarTooltip = memo(({ content, children, isSidebarCollapsed }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isSidebarCollapsed || !content) return children;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-2 text-sm font-medium
                     text-white bg-neutral-900 rounded-xl shadow-2xl border border-white/20
                     backdrop-blur-xl whitespace-nowrap"
          role="tooltip"
        >
          {content}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-800 rotate-45 border-l border-t border-white/20" />
        </div>
      )}
    </div>
  );
});

SidebarTooltip.displayName = 'SidebarTooltip';

const SidebarMenuItem = memo(({ item, isSubmenuItem = false, isActive, isSidebarCollapsed }) => {
  const IconComponent = item.icon;

  const linkClassName = useMemo(() => {
    const baseClasses = `relative flex items-center rounded-xl font-medium transition-all duration-200
                        overflow-hidden group focus:outline-none focus:ring-2 focus:ring-amber-400
                        focus:ring-offset-1 focus:ring-offset-green-900`;

    const sizeClasses =
      isSidebarCollapsed && !isSubmenuItem
        ? 'justify-center p-3.5'
        : `justify-start ${isSubmenuItem ? 'px-3 py-2.5 ml-4' : 'px-4 py-3'}`;

    const textClasses = isSubmenuItem ? 'text-xs rounded-lg' : 'text-sm';

    const stateClasses = isActive
      ? 'bg-gradient-to-r from-amber-500/80 to-amber-600/80 text-white shadow-lg border border-amber-400/50'
      : 'bg-green-800/30 text-neutral-300 border border-transparent hover:bg-green-700/50 hover:border-lime-600/50 hover:text-lime-300';

    return `${baseClasses} ${sizeClasses} ${textClasses} ${stateClasses}`;
  }, [isSidebarCollapsed, isSubmenuItem, isActive]);

  const iconClassName = useMemo(() => {
    const baseClasses = 'flex items-center justify-center transition-colors duration-200';
    const colorClasses = isActive ? 'text-white' : 'text-lime-400 group-hover:text-lime-300';
    const spacingClasses = isSidebarCollapsed && !isSubmenuItem ? '' : 'mr-3';

    return `${baseClasses} ${colorClasses} ${spacingClasses}`;
  }, [isActive, isSidebarCollapsed, isSubmenuItem]);

  return (
    <SidebarTooltip content={item.description || item.name} isSidebarCollapsed={isSidebarCollapsed}>
      <Link
        to={item.path}
        className={linkClassName}
        aria-label={`${item.name} - ${item.description || ''}`}
        title={item.description || item.name}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && (
          <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-amber-400 via-amber-500 to-lime-400 rounded-r-md" />
        )}

        <div className="flex items-center relative z-10">
          <div className={iconClassName}>
            <IconComponent
              className={`${isSubmenuItem ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
              aria-hidden="true"
            />
          </div>
          {(!isSidebarCollapsed || isSubmenuItem) && (
            <span
              className={`font-semibold tracking-wide ${isSubmenuItem ? 'text-xs' : 'text-sm'}`}
            >
              {item.name}
            </span>
          )}
        </div>
      </Link>
    </SidebarTooltip>
  );
});

SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarDropdownContent = memo(({ section, isOpen, isSidebarCollapsed, isActive }) => {
  const { hasPermission } = useAuth();

  if (isSidebarCollapsed || !isOpen) return null;

  return (
    <div className="ml-3 mt-1 space-y-1 border-l-2 border-green-700/40 pl-3.5 overflow-hidden">
      {section.items?.map((item) => {
        if (item.permission && !hasPermission(item.permission)) {
          return null;
        }

        return (
          <div key={item.path} className="space-y-1">
            <SidebarMenuItem
              item={item}
              isActive={isActive(item.path)}
              isSidebarCollapsed={isSidebarCollapsed}
            />
            {item.submenu && (
              <div className="ml-4 mt-1 space-y-1 border-l border-green-300/30 pl-3">
                {item.submenu.map((subItem) => (
                  <SidebarMenuItem
                    key={subItem.path}
                    item={subItem}
                    isSubmenuItem={true}
                    isActive={isActive(subItem.path)}
                    isSidebarCollapsed={isSidebarCollapsed}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

SidebarDropdownContent.displayName = 'SidebarDropdownContent';

const SidebarDropdownToggle = memo(
  ({ sectionKey, section, isOpen, hasActiveItem, isSidebarCollapsed, toggleDropdown }) => {
    const IconComponent = section.icon;

    const buttonClassName = useMemo(() => {
      const baseClasses = `relative w-full flex items-center rounded-xl font-semibold
                        transition-all duration-200 overflow-hidden group
                        focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 focus:ring-offset-green-900`;

      const sizeClasses = isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3';

      const stateClasses = hasActiveItem
        ? 'bg-gradient-to-r from-amber-500/80 to-amber-600/80 text-white shadow-lg border border-amber-400/50'
        : 'bg-green-800/30 text-neutral-300 border border-transparent hover:bg-green-700/50 hover:border-lime-600/50 hover:text-lime-300';

      return `${baseClasses} ${sizeClasses} ${stateClasses}`;
    }, [isSidebarCollapsed, hasActiveItem]);

    return (
      <SidebarTooltip content={section.description} isSidebarCollapsed={isSidebarCollapsed}>
        <button
          onClick={() => toggleDropdown(sectionKey)}
          className={buttonClassName}
          aria-expanded={isOpen}
          aria-label={`${section.name} - ${section.description}`}
          title={section.name}
          type="button"
        >
          {hasActiveItem && (
            <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-amber-400 via-amber-500 to-lime-400 rounded-r-md" />
          )}

          <div className="flex items-center relative z-10">
            <div
              className={`flex items-center justify-center transition-colors duration-200
                          ${hasActiveItem ? 'text-white' : 'text-lime-400 group-hover:text-lime-300'}
                          ${isSidebarCollapsed ? '' : 'mr-3'}`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="font-semibold text-sm tracking-wide">{section.name}</span>
                <div
                  className={`ml-auto transition-all duration-200
                           ${hasActiveItem ? 'text-white/80' : 'text-neutral-400 group-hover:text-lime-300'}
                           ${isOpen ? 'rotate-180' : ''}`}
                >
                  <FaChevronDown className="w-3.5 h-3.5" />
                </div>
              </>
            )}
          </div>
        </button>
      </SidebarTooltip>
    );
  }
);

SidebarDropdownToggle.displayName = 'SidebarDropdownToggle';

const SidebarSection = memo(
  ({ sectionKey, section, openDropdowns, toggleDropdown, isActive, isSidebarCollapsed }) => {
    const { hasPermission } = useAuth();

    const hasPermissionForSection = useCallback(
      (sec) => !sec.permission || hasPermission(sec.permission),
      []
    );

    const hasActiveItemInDropdown = useMemo(
      () =>
        section.isDropdown &&
        section.items?.some(
          (item) => isActive(item.path) || item.submenu?.some((sub) => isActive(sub.path))
        ),
      [section.isDropdown, section.items, isActive]
    );

    const isDropdownOpen = useMemo(
      () => openDropdowns.has(sectionKey),
      [openDropdowns, sectionKey]
    );
    const isItemActive = useMemo(
      () => (section.path ? isActive(section.path) : false),
      [section.path, isActive]
    );

    if (!hasPermissionForSection(section)) {
      return null;
    }

    return (
      <div className="mb-2">
        {section.isDropdown ? (
          <div>
            <SidebarDropdownToggle
              sectionKey={sectionKey}
              section={section}
              isOpen={isDropdownOpen}
              hasActiveItem={hasActiveItemInDropdown}
              isSidebarCollapsed={isSidebarCollapsed}
              toggleDropdown={toggleDropdown}
            />
            <SidebarDropdownContent
              section={section}
              isOpen={isDropdownOpen}
              isSidebarCollapsed={isSidebarCollapsed}
              isActive={isActive}
            />
          </div>
        ) : (
          <SidebarMenuItem
            item={section}
            isActive={isItemActive}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        )}
      </div>
    );
  }
);

SidebarSection.displayName = 'SidebarSection';

const VersionIndicator = memo(({ isSidebarCollapsed }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const appVersion = useMemo(() => import.meta.env.VITE_APP_VERSION || '1.0.0', []);

  if (isSidebarCollapsed) return null;

  return (
    <div
      className="relative p-3.5 rounded-xl bg-green-800/20 backdrop-blur-md border border-green-700/30 shadow-lg mt-auto"
      role="contentinfo"
      aria-label="Informações da versão do sistema"
    >
      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-center gap-1.5">
          <FaStar className="w-3 h-3 text-amber-400" aria-hidden="true" />
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-amber-400 to-lime-300 text-xs font-bold tracking-wide">
            LASCMMG v{appVersion}
          </div>
          <FaStar className="w-3 h-3 text-amber-400" aria-hidden="true" />
        </div>
        <div className="text-xs text-neutral-400 font-medium">Liga Acadêmica de Sinuca</div>
        <div className="flex items-center justify-center space-x-1.5">
          <div
            className="w-2 h-2 bg-gradient-to-r from-lime-400 to-green-400 rounded-full"
            aria-hidden="true"
          />
          <div className="text-[0.65rem] text-neutral-500 font-medium">© {currentYear}</div>
        </div>
      </div>
    </div>
  );
});

VersionIndicator.displayName = 'VersionIndicator';

const ConnectionStatus = memo(({ isSidebarCollapsed }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const statusText = isOnline ? 'Sistema Online' : 'Sistema Offline';
  const statusColor = isOnline ? 'from-lime-400 to-green-500' : 'from-red-400 to-red-500';

  return (
    <div
      className={`flex items-center justify-center mt-2.5 ${isSidebarCollapsed ? 'px-1' : 'px-2'}`}
      role="status"
      aria-label={statusText}
    >
      <div className="flex items-center space-x-1.5 text-xs font-medium">
        <div
          className={`w-2 h-2 bg-gradient-to-r ${statusColor} rounded-full`}
          aria-hidden="true"
        />
        {!isSidebarCollapsed && (
          <span className={`text-[0.7rem] ${isOnline ? 'text-neutral-400' : 'text-red-400'}`}>
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

const Sidebar = ({ isCollapsed, isMobileOpen, isMobile, onMobileClose }) => {
  const [openDropdowns, setOpenDropdowns] = useState(new Set());
  const location = useLocation();
  const sidebarRef = useRef(null);

  const isActive = useCallback(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname]
  );

  const toggleDropdown = useCallback(
    (sectionKey) => {
      if (isCollapsed) return;

      setOpenDropdowns((prev) => {
        const newSet = new Set();
        if (!prev.has(sectionKey)) {
          newSet.add(sectionKey);
        }
        return newSet;
      });
    },
    [isCollapsed]
  );

  // Auto-open dropdowns for active items
  useEffect(() => {
    const newOpenDropdowns = new Set();
    Object.entries(menuSections).forEach(([sectionKey, section]) => {
      if (
        section.items?.some(
          (item) => isActive(item.path) || item.submenu?.some((sub) => isActive(sub.path))
        )
      ) {
        newOpenDropdowns.add(sectionKey);
      }
    });
    setOpenDropdowns(newOpenDropdowns);
  }, [location.pathname, isActive]);

  // Handle click outside for mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobile &&
        isMobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        onMobileClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileOpen, onMobileClose]);

  const sidebarWidth = isCollapsed ? (isMobile ? 0 : 80) : 280;
  const sidebarTransform = isMobile ? (isMobileOpen ? 0 : -280) : 0;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{
          width: isMobile ? 280 : sidebarWidth,
          transform: `translateX(${sidebarTransform}px)`,
          transition: 'all 0.3s ease-in-out',
        }}
        className={`fixed top-16 sm:top-20 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] z-50
                   shadow-2xl ${isMobile && !isMobileOpen ? 'invisible' : ''}`}
        aria-label="Barra lateral de navegação"
        role="navigation"
      >
        <div
          className="flex flex-col h-full bg-gradient-to-b from-green-900 via-green-800 to-neutral-900
                        backdrop-blur-2xl border-r border-green-700/50 rounded-r-none md:rounded-r-3xl"
        >
          {/* Header */}
          <div
            className={`flex items-center border-b border-green-700/50 bg-gradient-to-r from-green-800/60 to-green-900/40
                          ${isCollapsed ? 'justify-center px-3 py-3.5' : 'px-5 py-4'}`}
          >
            {!isCollapsed ? (
              <Link
                to="/"
                className="flex items-center group rounded-xl p-2.5 transition-all duration-200
                           hover:bg-green-700/40 focus:outline-none focus:ring-2 focus:ring-amber-400
                           focus:ring-offset-1 focus:ring-offset-green-900"
                aria-label="Ir para página inicial"
              >
                <div
                  className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl
                                flex items-center justify-center shadow-lg border-2 border-amber-400/50
                                transition-transform duration-200 group-hover:scale-110"
                >
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <div className="ml-3.5 space-y-0.5">
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-lime-400 to-amber-300 text-xl font-black tracking-tight">
                    LASCMMG
                  </div>
                  <div className="text-xs text-neutral-400 font-medium">Sistema de Torneios</div>
                </div>
              </Link>
            ) : (
              <Link
                to="/"
                aria-label="Ir para página inicial"
                className="group rounded-xl p-2.5 transition-all duration-200 hover:bg-green-700/40
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <div
                  className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg
                                flex items-center justify-center shadow-md border border-amber-400/50
                                transition-transform duration-200 group-hover:scale-110"
                >
                  <span className="text-white font-bold text-sm">L</span>
                </div>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <div
            className={`flex flex-col flex-grow overflow-y-auto ${isCollapsed ? 'px-2 py-3' : 'px-3 py-4'}`}
          >
            <nav className="flex-1 space-y-1.5" aria-label="Menu principal">
              {Object.entries(menuSections).map(([key, section]) => (
                <SidebarSection
                  key={key}
                  sectionKey={key}
                  section={section}
                  openDropdowns={openDropdowns}
                  toggleDropdown={toggleDropdown}
                  isActive={isActive}
                  isSidebarCollapsed={isCollapsed}
                />
              ))}
            </nav>

            {/* Footer */}
            <div
              className={`flex-shrink-0 mt-auto pt-4 ${isCollapsed ? 'px-1 pb-2' : 'px-2 pb-3'}`}
            >
              <VersionIndicator isSidebarCollapsed={isCollapsed} />
              <ConnectionStatus isSidebarCollapsed={isCollapsed} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
