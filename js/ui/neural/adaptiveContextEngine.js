import userBehaviorTracker from './userBehaviorTracker.js';
import * as theme from '../theme/index.js'; // Importa de index.js

const CONTEXT_CHECK_INTERVAL = 30000;
const CONTEXT_STORAGE_KEY = 'adaptiveContextPreferences';
const MAX_LAYOUT_ADAPTATIONS = 3;

class AdaptiveContextEngine {
  constructor() {
    this.currentContext = {
      time: {
        hour: new Date().getHours(),
        timeOfDay: this.getTimeOfDayContext(),
        isWorkingHour: this.isWorkingHour(),
        day: new Date().getDay(),
        isWeekend: [0, 6].includes(new Date().getDay()),
        date: new Date().toISOString(),
      },

      device: {
        type: this.detectDeviceType(),
        orientation:
          window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        pixelRatio: window.devicePixelRatio || 1,
        hasTouchscreen:
          'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isHighPerformance: this.estimateDevicePerformance(),
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)')
          .matches,
      },

      environment: {
        location: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language:
          navigator.language || document.documentElement.lang || 'pt-BR',
        batteryStatus: null,
        connectionType: this.detectConnectionType(),
        isOffline: !navigator.onLine,
      },

      usage: {
        currentSection: this.detectCurrentSection(),
        lastInteraction: new Date(),
        isIdle: false,
        idleDuration: 0,
        focusMode: false,
        taskContext: this.detectTaskContext(),
      },

      accessibility: {
        prefersReducedMotion: window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches,
        prefersReducedTransparency: window.matchMedia(
          '(prefers-reduced-transparency: reduce)'
        ).matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: more)')
          .matches,
        fontSize: parseInt(
          window.getComputedStyle(document.documentElement).fontSize,
          10
        ),
      },
    };

    this.activeLayouts = new Map();

    this.contextLayoutMap = {
      morning: 'energetic-layout',
      afternoon: 'productive-layout',
      evening: 'relaxed-layout',
      night: 'focus-layout',

      mobile: 'compact-layout',
      tablet: 'balanced-layout',
      desktop: 'expanded-layout',

      portrait: 'vertical-optimized',
      landscape: 'horizontal-optimized',

      browsing: 'discovery-layout',
      'data-entry': 'form-optimized',
      analysis: 'data-focused',
      admin: 'control-focused',
      'tournament-view': 'visualization-focused',
    };

    this.defaultLayout = 'standard-layout';

    this.initialize();
  }

  initialize() {
    this.setupContextSensors();

    this.startContextMonitoring();

    this.applyInitialAdaptations();

    this.observeNavigationChanges();

    userBehaviorTracker.startTracking();

    this.loadSavedPreferences();
  }

  setupContextSensors() {
    window.addEventListener('resize', this.handleResize.bind(this));

    window.addEventListener(
      'orientationchange',
      this.handleOrientationChange.bind(this)
    );

    window.addEventListener('online', () =>
      this.updateEnvironmentContext({ isOffline: false })
    );
    window.addEventListener('offline', () =>
      this.updateEnvironmentContext({ isOffline: true })
    );

    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );

    ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(
      (eventType) => {
        document.addEventListener(
          eventType,
          this.handleUserInteraction.bind(this)
        );
      }
    );

    this.setupMediaQueryListeners();

    this.detectBatteryStatus();

    setInterval(() => this.updateTimeContext(), 60000);
  }

  setupMediaQueryListeners() {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
      this.updateAccessibilityContext({ prefersDarkMode: e.matches });
    });

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    reducedMotionQuery.addEventListener('change', (e) => {
      this.updateAccessibilityContext({ prefersReducedMotion: e.matches });
    });

    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    contrastQuery.addEventListener('change', (e) => {
      this.updateAccessibilityContext({ prefersHighContrast: e.matches });
    });
  }

  startContextMonitoring() {
    setInterval(() => {
      this.updateTimeContext();

      this.updateCurrentSection();

      this.checkIdleState();

      this.updateTaskContext();

      this.applyContextualAdaptations();
    }, CONTEXT_CHECK_INTERVAL);
  }

  applyInitialAdaptations() {
    const deviceType = this.currentContext.device.type;
    this.applyLayoutForDeviceType(deviceType);

    const timeOfDay = this.currentContext.time.timeOfDay;
    this.applyLayoutForTimeOfDay(timeOfDay);

    const orientation = this.currentContext.device.orientation;
    this.applyLayoutForOrientation(orientation);

    this.applyAccessibilityAdaptations();
  }

  observeNavigationChanges() {
    window.addEventListener('hashchange', () => {
      this.updateCurrentSection();
      this.applyLayoutForCurrentSection();
    });

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'childList' ||
          (mutation.type === 'attributes' &&
            mutation.attributeName === 'class' &&
            mutation.target.classList.contains('active'))
        ) {
          this.updateCurrentSection();
          this.applyLayoutForCurrentSection();
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-active-section'],
    });
  }

  detectDeviceType() {
    const width = window.innerWidth;

    if (width < 768) {
      return 'mobile';
    } else if (width < 1024) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  detectConnectionType() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }

    return 'unknown';
  }

  estimateDevicePerformance() {
    const hasHighPerformanceHardware =
      window.devicePixelRatio >= 2 && navigator.hardwareConcurrency >= 4;

    return hasHighPerformanceHardware;
  }

  detectBatteryStatus() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        this.updateEnvironmentContext({
          batteryStatus: {
            level: battery.level,
            charging: battery.charging,
          },
        });

        battery.addEventListener('levelchange', () => {
          this.updateEnvironmentContext({
            batteryStatus: {
              level: battery.level,
              charging: battery.charging,
            },
          });
        });

        battery.addEventListener('chargingchange', () => {
          this.updateEnvironmentContext({
            batteryStatus: {
              level: battery.level,
              charging: battery.charging,
            },
          });
        });
      });
    }
  }

  detectCurrentSection() {
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (path.includes('admin.html')) {
      return hash ? `admin:${hash.replace('#', '')}` : 'admin:dashboard';
    } else if (
      path.endsWith('index.html') ||
      path === '/' ||
      path.endsWith('/')
    ) {
      return hash ? `main:${hash.replace('#', '')}` : 'main:home';
    }

    const activeSection = document.querySelector(
      '.section.active, [data-section].active'
    );
    if (activeSection) {
      return activeSection.dataset.section || 'active-section';
    }

    return 'unknown';
  }

  detectTaskContext() {
    const path = window.location.pathname;

    if (path.includes('admin')) {
      return 'admin';
    }

    const visibleForms = document.querySelectorAll(
      'form:not([hidden]):not([style*="display: none"])'
    );
    if (visibleForms.length > 0) {
      return 'data-entry';
    }

    const visibleTables = document.querySelectorAll(
      'table:not([hidden]):not([style*="display: none"])'
    );
    if (visibleTables.length > 0) {
      return 'analysis';
    }

    if (document.querySelector('.bracket, .tournament-view')) {
      return 'tournament-view';
    }

    return 'browsing';
  }

  getTimeOfDayContext() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 18) {
      return 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      return 'evening';
    } else {
      return 'night';
    }
  }

  isWorkingHour() {
    const date = new Date();
    const hour = date.getHours();
    const day = date.getDay();

    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }

  handleResize() {
    this.updateDeviceContext({
      orientation:
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      type: this.detectDeviceType(),
    });

    this.applyLayoutForOrientation(this.currentContext.device.orientation);
    this.applyLayoutForDeviceType(this.currentContext.device.type);
  }

  handleOrientationChange() {
    const isPortrait = window.innerHeight > window.innerWidth;

    this.updateDeviceContext({
      orientation: isPortrait ? 'portrait' : 'landscape',
    });

    this.applyLayoutForOrientation(isPortrait ? 'portrait' : 'landscape');
  }

  handleVisibilityChange() {
    const isVisible = document.visibilityState === 'visible';

    if (isVisible) {
      this.updateTimeContext();
      this.updateCurrentSection();
      this.applyContextualAdaptations();
    }
  }

  handleUserInteraction() {
    this.updateUsageContext({
      lastInteraction: new Date(),
      isIdle: false,
      idleDuration: 0,
    });
  }

  updateTimeContext() {
    const now = new Date();

    this.currentContext.time = {
      ...this.currentContext.time,
      hour: now.getHours(),
      timeOfDay: this.getTimeOfDayContext(),
      isWorkingHour: this.isWorkingHour(),
      day: now.getDay(),
      isWeekend: [0, 6].includes(now.getDay()),
      date: now.toISOString(),
    };

    this.applyLayoutForTimeOfDay(this.currentContext.time.timeOfDay);
  }

  updateDeviceContext(updates) {
    this.currentContext.device = {
      ...this.currentContext.device,
      ...updates,
    };
  }

  updateEnvironmentContext(updates) {
    this.currentContext.environment = {
      ...this.currentContext.environment,
      ...updates,
    };

    if (updates.isOffline) {
      this.applyOfflineMode();
    }

    if (
      updates.batteryStatus &&
      updates.batteryStatus.level < 0.15 &&
      !updates.batteryStatus.charging
    ) {
      this.applyLowPowerMode();
    }
  }

  updateUsageContext(updates) {
    this.currentContext.usage = {
      ...this.currentContext.usage,
      ...updates,
    };
  }

  updateAccessibilityContext(updates) {
    this.currentContext.accessibility = {
      ...this.currentContext.accessibility,
      ...updates,
    };

    this.applyAccessibilityAdaptations();
  }

  updateCurrentSection() {
    const newSection = this.detectCurrentSection();

    if (newSection !== this.currentContext.usage.currentSection) {
      this.updateUsageContext({
        currentSection: newSection,
      });

      this.updateTaskContext();

      this.applyLayoutForCurrentSection();
    }
  }

  updateTaskContext() {
    const newTaskContext = this.detectTaskContext();

    if (newTaskContext !== this.currentContext.usage.taskContext) {
      this.updateUsageContext({
        taskContext: newTaskContext,
      });

      this.applyLayoutForTaskContext(newTaskContext);
    }
  }

  checkIdleState() {
    const now = new Date();
    const lastInteraction = this.currentContext.usage.lastInteraction;
    const idleThreshold = 5 * 60 * 1000;

    const idleDuration = now - lastInteraction;
    const isIdle = idleDuration > idleThreshold;

    if (isIdle !== this.currentContext.usage.isIdle) {
      this.updateUsageContext({
        isIdle,
        idleDuration,
      });

      if (isIdle) {
        this.applyIdleMode();
      }
    }
  }

  applyContextualAdaptations() {
    if (this.activeLayouts.size >= MAX_LAYOUT_ADAPTATIONS) {
      return;
    }

    this.applyAccessibilityAdaptations();

    this.applyLayoutForDeviceType(this.currentContext.device.type);
    this.applyLayoutForOrientation(this.currentContext.device.orientation);

    this.applyLayoutForCurrentSection();
    this.applyLayoutForTaskContext(this.currentContext.usage.taskContext);

    this.applyLayoutForTimeOfDay(this.currentContext.time.timeOfDay);
  }

  applyLayoutForDeviceType(deviceType) {
    const layoutKey = this.contextLayoutMap[deviceType] || this.defaultLayout;

    this.activeLayouts.set('device-layout', {
      type: 'device-responsive',
      layoutKey,
      context: deviceType,
    });

    document.body.classList.remove(
      'device-mobile',
      'device-tablet',
      'device-desktop'
    );
    document.body.classList.add(`device-${deviceType}`);

    switch (deviceType) {
      case 'mobile':
        this.applySingleColumnLayout();
        break;
      case 'tablet':
        this.applyAdaptiveColumnLayout();
        break;
      case 'desktop':
        this.applyMultiColumnLayout();
        break;
    }
  }

  applyLayoutForOrientation(orientation) {
    const layoutKey = this.contextLayoutMap[orientation];

    this.activeLayouts.set('orientation-layout', {
      type: 'orientation-responsive',
      layoutKey,
      context: orientation,
    });

    document.body.classList.remove(
      'orientation-portrait',
      'orientation-landscape'
    );
    document.body.classList.add(`orientation-${orientation}`);

    const deviceType = this.currentContext.device.type;

    if (deviceType === 'mobile' || deviceType === 'tablet') {
      if (orientation === 'portrait') {
        document.documentElement.style.setProperty(
          '--grid-template-columns',
          '1fr'
        );
        document.documentElement.style.setProperty(
          '--flex-direction',
          'column'
        );
      } else {
        const isTablet = deviceType === 'tablet';
        document.documentElement.style.setProperty(
          '--grid-template-columns',
          isTablet ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr 1fr'
        );
        document.documentElement.style.setProperty('--flex-direction', 'row');
      }
    }
  }

  applyLayoutForTimeOfDay(timeOfDay) {
    const layoutKey = this.contextLayoutMap[timeOfDay];

    this.activeLayouts.set('time-layout', {
      type: 'temporal-context',
      layoutKey,
      context: timeOfDay,
    });

    document.body.classList.remove(
      'time-morning',
      'time-afternoon',
      'time-evening',
      'time-night'
    );
    document.body.classList.add(`time-${timeOfDay}`);

    let primaryHue, intensity;

    switch (timeOfDay) {
      case 'morning':
        primaryHue = 30;
        intensity = 'medium';
        break;
      case 'afternoon':
        primaryHue = 210;
        intensity = 'medium';
        break;
      case 'evening':
        primaryHue = 260;
        intensity = 'low';
        break;
      case 'night':
        primaryHue = 240;
        intensity = 'low';
        break;
    }

    if (
      theme.dynamicColorSystem &&
      typeof theme.dynamicColorSystem.setUserPreference === 'function'
    ) {
      theme.dynamicColorSystem.setUserPreference('preferredHue', primaryHue);
      theme.dynamicColorSystem.setUserPreference('colorIntensity', intensity);
    }
  }

  applyLayoutForCurrentSection() {
    const currentSection = this.currentContext.usage.currentSection;

    let sectionCategory = 'default';

    if (currentSection.includes('admin:')) {
      sectionCategory = 'admin';
    } else if (
      currentSection.includes('bracket') ||
      currentSection.includes('tournament')
    ) {
      sectionCategory = 'tournament-view';
    } else if (
      currentSection.includes('statistics') ||
      currentSection.includes('stats')
    ) {
      sectionCategory = 'analysis';
    } else if (
      currentSection.includes('form') ||
      currentSection.includes('edit')
    ) {
      sectionCategory = 'data-entry';
    }

    const layoutKey =
      this.contextLayoutMap[sectionCategory] || this.defaultLayout;

    this.activeLayouts.set('section-layout', {
      type: 'section-specific',
      layoutKey,
      context: sectionCategory,
    });

    const allSectionClasses = Object.keys(this.contextLayoutMap).map(
      (key) => `section-${key}`
    );

    document.body.classList.remove(...allSectionClasses);
    document.body.classList.add(`section-${sectionCategory}`);

    switch (sectionCategory) {
      case 'tournament-view':
        this.optimizeTournamentView();
        break;
      case 'analysis':
        this.optimizeDataView();
        break;
      case 'data-entry':
        this.optimizeFormExperience();
        break;
      case 'admin':
        this.optimizeAdminInterface();
        break;
    }
  }

  applyLayoutForTaskContext(taskContext) {
    const layoutKey = this.contextLayoutMap[taskContext] || this.defaultLayout;

    this.activeLayouts.set('task-layout', {
      type: 'task-context',
      layoutKey,
      context: taskContext,
    });

    document.body.classList.remove(
      'task-browsing',
      'task-data-entry',
      'task-analysis',
      'task-admin',
      'task-tournament-view'
    );
    document.body.classList.add(`task-${taskContext}`);
  }

  loadSavedPreferences() {
    try {
      const savedPreferences = localStorage.getItem(CONTEXT_STORAGE_KEY);
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);

        if (preferences.layouts) {
          Object.entries(preferences.layouts).forEach(([key, value]) => {
            if (value && this.contextLayoutMap[key]) {
              this.activeLayouts.set(key, {
                type: 'user-preference',
                layoutKey: this.contextLayoutMap[key],
                context: key,
              });
            }
          });
        }
      }
    } catch (error) {
      console.error(
        '[AdaptiveContextEngine] Erro ao carregar preferências:',
        error
      );
    }
  }

  savePreferences() {
    try {
      const preferences = {
        layouts: Object.fromEntries(this.activeLayouts),
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error(
        '[AdaptiveContextEngine] Erro ao salvar preferências:',
        error
      );
    }
  }

  applySingleColumnLayout() {}
  applyAdaptiveColumnLayout() {}
  applyMultiColumnLayout() {}
  applyOfflineMode() {}
  applyLowPowerMode() {}
  applyIdleMode() {}
  applyAccessibilityAdaptations() {}
  optimizeTournamentView() {}
  optimizeDataView() {}
  optimizeFormExperience() {}
  optimizeAdminInterface() {}
}

export default AdaptiveContextEngine;
