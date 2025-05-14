import userBehaviorTracker from './userBehaviorTracker.js';
import { dynamicColorSystem } from '../theme/dynamicColorSystem.js';

const LEARNING_RATE = 0.05;
const ADAPTATION_THRESHOLD = 0.65;
const PREFERENCE_DECAY = 0.98;
const MIN_INTERACTIONS_REQUIRED = 20;
const ADAPTATION_STORAGE_KEY = 'neuralAdaptivePreferences';
const MAX_AUTO_ADAPTATIONS = 5;

export class NeuralAdaptiveEngine {
  constructor() {
    this.userModels = {
      elementPreferences: {
        navigationItems: {},
        actionButtons: {},
        contentSections: {},
        formFields: {},
      },

      temporalContext: {
        activeHours: [],
        inactiveDays: [],
        averageSessionDuration: 0,
        timeSpentPerSection: {},
      },

      workflowPatterns: {
        commonSequences: [],
        taskCompletion: {},
        navigationPaths: [],
      },

      visualPreferences: {
        colorScheme: null,
        contrastLevel: null,
        density: 'regular',
        animationLevel: 'medium',
      },

      deviceContext: {
        screenSize: null,
        bandwidth: 'unknown',
        devicePerformance: 'unknown',
        environment: 'unknown',
      },

      engagementMetrics: {
        sessionFrequency: 0,
        interactionDensity: 0,
        returnRate: 0,
        featureDiscovery: {},
      },
    };

    this.activeAdaptations = new Map();

    this.adaptationHistory = [];

    this.currentContext = {
      time: new Date(),
      location: null,
      deviceOrientation:
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      batteryLevel: null,
      connection: null,
      section: null,
      lastActivity: new Date(),
      isActive: true,
    };

    this.loadUserModels();

    this.initialize();
  }

  initialize() {
    this.setupContextSensors();

    this.startPeriodicModelUpdates();

    this.observeInterfaceChanges();

    this.applyActiveAdaptations();

    setTimeout(() => this.analyzeUserBehavior(), 5000);
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

    this.trackCurrentSection();
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

  startPeriodicModelUpdates() {
    setInterval(() => this.analyzeUserBehavior(), 300000);

    const events = ['login', 'form-submit', 'task-complete', 'config-change'];

    events.forEach((event) => {
      document.addEventListener(`app:${event}`, () => {
        this.analyzeUserBehavior();
      });
    });

    setInterval(() => this.saveUserModels(), 600000);

    window.addEventListener('beforeunload', () => this.saveUserModels());
  }

  observeInterfaceChanges() {
    const observer = new MutationObserver((mutations) => {
      let needsEvaluation = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (this.isSignificantElement(node)) {
                needsEvaluation = true;
                break;
              }
            }
          }
        }

        if (mutation.type === 'attributes') {
          if (
            this.isSignificantAttribute(mutation.target, mutation.attributeName)
          ) {
            needsEvaluation = true;
            break;
          }
        }

        if (needsEvaluation) break;
      }

      if (needsEvaluation) {
        setTimeout(() => this.evaluateContextualAdaptations(), 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'class',
        'style',
        'aria-expanded',
        'aria-hidden',
        'data-state',
      ],
    });
  }

  detectLocationContext() {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const userLanguage = navigator.language || navigator.userLanguage;

    const currentHour = new Date().getHours();

    let probableContext = 'unknown';

    if (
      currentHour >= 9 &&
      currentHour <= 17 &&
      new Date().getDay() >= 1 &&
      new Date().getDay() <= 5
    ) {
      probableContext = 'work';
    } else if (currentHour >= 18 || currentHour <= 7) {
      probableContext = 'home';
    }

    this.currentContext.location = {
      timezone: userTimezone,
      language: userLanguage,
      probableContext,
    };
  }

  trackCurrentSection() {
    setInterval(() => {
      const pathName = window.location.pathname;
      const hash = window.location.hash;

      let currentSection = null;

      if (pathName.includes('admin.html')) {
        if (hash) {
          currentSection = `admin:${hash.replace('#', '')}`;
        } else {
          currentSection = 'admin:dashboard';
        }
      } else if (
        pathName.includes('index.html') ||
        pathName === '/' ||
        pathName === ''
      ) {
        if (hash) {
          currentSection = `main:${hash.replace('#', '')}`;
        } else {
          currentSection = 'main:home';
        }
      } else {
        currentSection = pathName;
      }

      if (currentSection !== this.currentContext.section) {
        const previousSection = this.currentContext.section;
        this.currentContext.section = currentSection;

        if (previousSection) {
          this.recordSectionTransition(previousSection, currentSection);
        }

        this.evaluateSectionSpecificAdaptations(currentSection);
      }
    }, 5000);
  }

  analyzeUserBehavior() {
    const metrics = userBehaviorTracker.getMetrics();

    const totalInteractions =
      metrics.interactions.clicks +
      metrics.interactions.keyPresses +
      metrics.interactions.formSubmits +
      metrics.interactions.navigationActions;

    if (totalInteractions < MIN_INTERACTIONS_REQUIRED) {
      return;
    }

    this.updateElementPreferences(metrics);

    this.updateTemporalContext(metrics);

    this.updateWorkflowPatterns();

    this.updateVisualPreferences(metrics);

    this.updateEngagementMetrics();

    this.generateAdaptations();
  }

  updateElementPreferences(_metrics) {
    const frequentElements = userBehaviorTracker.getMostFrequentElements(20);

    this.userModels.elementPreferences.navigationItems = {};
    this.userModels.elementPreferences.actionButtons = {};
    this.userModels.elementPreferences.contentSections = {};
    this.userModels.elementPreferences.formFields = {};

    frequentElements.forEach((element) => {
      if (
        element.identifier.includes('nav') ||
        element.type === 'a' ||
        element.identifier.includes('menu') ||
        element.identifier.includes('sidebar')
      ) {
        this.userModels.elementPreferences.navigationItems[element.identifier] =
          {
            count: element.count,
            lastUsed: element.lastUsed,
          };
      } else if (
        element.type === 'button' ||
        element.identifier.includes('btn') ||
        element.identifier.includes('action')
      ) {
        this.userModels.elementPreferences.actionButtons[element.identifier] = {
          count: element.count,
          lastUsed: element.lastUsed,
        };
      } else if (
        element.type === 'input' ||
        element.type === 'select' ||
        element.type === 'textarea' ||
        element.identifier.includes('form')
      ) {
        this.userModels.elementPreferences.formFields[element.identifier] = {
          count: element.count,
          lastUsed: element.lastUsed,
        };
      } else if (
        element.identifier.includes('section') ||
        element.identifier.includes('panel') ||
        element.identifier.includes('content') ||
        element.identifier.includes('container')
      ) {
        this.userModels.elementPreferences.contentSections[element.identifier] =
          {
            count: element.count,
            lastUsed: element.lastUsed,
          };
      }
    });
  }

  updateTemporalContext(_metrics) {
    this.userModels.temporalContext.activeHours = userBehaviorTracker
      .getPeakUsageHours(5)
      .map((hour) => hour.hour);

    const dayActivity = _metrics.usageDayDistribution
      .map((count, day) => ({ day, count }))
      .sort((a, b) => a.count - b.count);

    this.userModels.temporalContext.inactiveDays = dayActivity
      .slice(0, 2)
      .map((day) => day.day);

    this.userModels.temporalContext.averageSessionDuration =
      _metrics.sessionData.averageDuration;

    this.userModels.temporalContext.timeSpentPerSection = _metrics.timeSpent;
  }

  updateWorkflowPatterns() {
    const metrics = userBehaviorTracker.getMetrics();
    const history = metrics.interactionHistory;

    if (history.length < 10) return;

    const sequences = [];
    const windowSize = 3;

    for (let i = 0; i < history.length - windowSize; i++) {
      const sequence = history.slice(i, i + windowSize).map((interaction) => {
        if (interaction.type === 'click' || interaction.type === 'hover') {
          return `${interaction.type}:${interaction.details.identifier || 'unknown'}`;
        } else if (interaction.type === 'navigation') {
          return `nav:${interaction.details.type || 'unknown'}`;
        } else {
          return `${interaction.type}:generic`;
        }
      });

      sequences.push(sequence.join('->'));
    }

    const sequenceCounts = sequences.reduce((acc, seq) => {
      acc[seq] = (acc[seq] || 0) + 1;
      return acc;
    }, {});

    this.userModels.workflowPatterns.commonSequences = Object.entries(
      sequenceCounts
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sequence, count]) => ({ sequence, count }));

    this.identifyNavigationPaths();
  }

  identifyNavigationPaths() {
    const metrics = userBehaviorTracker.getMetrics();
    const navEvents = metrics.interactionHistory.filter(
      (interaction) => interaction.type === 'navigation'
    );

    if (navEvents.length < 5) return;

    const paths = [];
    let currentPath = [];
    let lastTimestamp = null;

    navEvents.forEach((event) => {
      const timestamp = new Date(event.timestamp);

      if (
        !lastTimestamp ||
        timestamp - new Date(lastTimestamp) > 5 * 60 * 1000
      ) {
        if (currentPath.length > 1) {
          paths.push([...currentPath]);
        }
        currentPath = [event.details.url || event.details.to];
      } else {
        currentPath.push(event.details.url || event.details.to);
      }

      lastTimestamp = event.timestamp;
    });

    if (currentPath.length > 1) {
      paths.push([...currentPath]);
    }

    this.userModels.workflowPatterns.navigationPaths = paths
      .filter((path) => path.length >= 2)
      .slice(0, 10);
  }

  updateVisualPreferences(_metrics) {
    const colorPanel = document.getElementById('color-config-panel');
    if (colorPanel && colorPanel.dataset.userConfigured === 'true') {
      this.userModels.visualPreferences.colorScheme =
        colorPanel.dataset.selectedScheme || null;
    }

    const frequentElements = userBehaviorTracker.getMostFrequentElements(50);

    let compactCount = 0;
    let spaciousCount = 0;

    frequentElements.forEach((element) => {
      if (
        element.identifier.includes('compact') ||
        element.identifier.includes('dense') ||
        element.identifier.includes('small')
      ) {
        compactCount++;
      } else if (
        element.identifier.includes('spacious') ||
        element.identifier.includes('large') ||
        element.identifier.includes('expanded')
      ) {
        spaciousCount++;
      }
    });

    if (compactCount > spaciousCount * 2) {
      this.userModels.visualPreferences.density = 'compact';
    } else if (spaciousCount > compactCount * 2) {
      this.userModels.visualPreferences.density = 'spacious';
    } else {
      this.userModels.visualPreferences.density = 'regular';
    }

    this.checkAccessibilityPreferences();
  }

  checkAccessibilityPreferences() {
    const highContrast = document.body.classList.contains('high-contrast');
    const veryHighContrast =
      document.body.classList.contains('very-high-contrast');

    if (veryHighContrast) {
      this.userModels.visualPreferences.contrastLevel = 'very-high';
    } else if (highContrast) {
      this.userModels.visualPreferences.contrastLevel = 'high';
    } else {
      this.userModels.visualPreferences.contrastLevel = 'normal';
    }

    const reducedMotion = document.body.classList.contains('reduced-motion');
    this.userModels.visualPreferences.animationLevel = reducedMotion
      ? 'minimal'
      : 'medium';
  }

  updateEngagementMetrics() {
    if (this.userModels.engagementMetrics.interactionDensity > 0) {
      this.userModels.engagementMetrics.interactionDensity *= PREFERENCE_DECAY;
    }
  }

  recordSectionTransition(_fromSection, _toSection) {}

  generateAdaptations() {
    if (this.activeAdaptations.size >= MAX_AUTO_ADAPTATIONS) {
      return;
    }

    this.generateElementPreferenceAdaptations();

    this.generateWorkflowAdaptations();

    this.generateVisualAdaptations();

    this.generateTemporalAdaptations();

    this.applyActiveAdaptations();
  }

  generateElementPreferenceAdaptations() {
    const topNavItems = Object.entries(
      this.userModels.elementPreferences.navigationItems
    )
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([id]) => id);

    if (topNavItems.length > 0) {
      this.activeAdaptations.set('highlight-nav-items', {
        type: 'element-emphasis',
        elements: topNavItems,
        priority: 'medium',
        reason: 'Itens de navegação frequentemente utilizados',
        applyFunction: () => this.applyElementEmphasis(topNavItems),
      });
    }

    const topActionButtons = Object.entries(
      this.userModels.elementPreferences.actionButtons
    )
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2)
      .map(([id]) => id);

    if (topActionButtons.length > 0) {
      this.activeAdaptations.set('quick-actions', {
        type: 'quick-actions',
        elements: topActionButtons,
        priority: 'high',
        reason: 'Ações mais frequentemente utilizadas',
        applyFunction: () => this.createQuickActions(topActionButtons),
      });
    }
  }

  generateWorkflowAdaptations() {
    if (this.userModels.workflowPatterns.commonSequences.length > 0) {
      const topSequence = this.userModels.workflowPatterns.commonSequences[0];

      if (topSequence && topSequence.count > 5) {
        this.activeAdaptations.set('workflow-shortcut', {
          type: 'workflow-optimization',
          sequence: topSequence.sequence,
          priority: 'medium',
          reason: 'Sequência de ações frequentemente realizada',
          applyFunction: () =>
            this.createWorkflowShortcut(topSequence.sequence),
        });
      }
    }

    if (this.userModels.workflowPatterns.navigationPaths.length > 0) {
      const commonPath = this.userModels.workflowPatterns.navigationPaths[0];

      if (commonPath && commonPath.length >= 3) {
        this.activeAdaptations.set('nav-path-optimization', {
          type: 'navigation-optimization',
          path: commonPath,
          priority: 'medium',
          reason: 'Caminho de navegação frequentemente percorrido',
          applyFunction: () => this.optimizeNavigationPath(commonPath),
        });
      }
    }
  }

  generateVisualAdaptations() {
    if (this.userModels.visualPreferences.density !== 'regular') {
      this.activeAdaptations.set('density-adaptation', {
        type: 'visual-density',
        preference: this.userModels.visualPreferences.density,
        priority: 'medium',
        reason: 'Preferência detectada por densidade de interface',
        applyFunction: () =>
          this.applyDensityPreference(
            this.userModels.visualPreferences.density
          ),
      });
    }

    if (this.userModels.visualPreferences.colorScheme) {
      this.activeAdaptations.set('color-scheme-adaptation', {
        type: 'color-scheme',
        scheme: this.userModels.visualPreferences.colorScheme,
        priority: 'high',
        reason: 'Esquema de cores preferido pelo usuário',
        applyFunction: () =>
          this.applyColorScheme(this.userModels.visualPreferences.colorScheme),
      });
    }

    this.activeAdaptations.set('animation-level-adaptation', {
      type: 'animation-level',
      level: this.userModels.visualPreferences.animationLevel,
      priority: 'high',
      reason: 'Nível de animação preferido pelo usuário',
      applyFunction: () =>
        this.applyAnimationLevel(
          this.userModels.visualPreferences.animationLevel
        ),
    });
  }

  generateTemporalAdaptations() {
    const hour = new Date().getHours();

    const isActiveHour =
      this.userModels.temporalContext.activeHours.includes(hour);

    if (isActiveHour) {
      this.activeAdaptations.set('peak-hour-optimization', {
        type: 'temporal-optimization',
        hour: hour,
        priority: 'high',
        reason: 'Horário de uso intenso detectado',
        applyFunction: () => this.optimizeForPeakUsage(),
      });
    }
  }

  applyColorScheme(scheme) {
    return dynamicColorSystem.setColorScheme(scheme);
  }

  evaluateContextualAdaptations() {
    if (this.activeAdaptations.size >= MAX_AUTO_ADAPTATIONS) {
      return;
    }

    const adaptations = this.getRelevantAdaptations();

    adaptations.forEach((adaptation) => {
      if (adaptation.confidence > ADAPTATION_THRESHOLD) {
        this.applyAdaptation(adaptation);
      }
    });
  }

  getRelevantAdaptations() {
    return [
      {
        id: 'color-scheme',
        confidence: 0.7,
        type: 'visual',
        apply: () => this.applyColorScheme('dark'),
      },
    ];
  }

  applyAdaptation(adaptation) {
    adaptation.apply();
  }

  loadUserModels() {
    try {
      const savedData = localStorage.getItem(ADAPTATION_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const blendFactor = LEARNING_RATE;
        this.userModels = {
          ...this.userModels,
          ...parsedData,
          engagementMetrics: {
            ...this.userModels.engagementMetrics,
            ...parsedData.engagementMetrics,
            interactionDensity:
              this.userModels.engagementMetrics.interactionDensity *
                (1 - blendFactor) +
              parsedData.engagementMetrics.interactionDensity * blendFactor,
          },
        };
      }
    } catch (error) {
      console.error('[NeuralAdaptiveEngine] Erro ao carregar modelos:', error);
    }
  }

  saveUserModels() {
    try {
      localStorage.setItem(
        ADAPTATION_STORAGE_KEY,
        JSON.stringify(this.userModels)
      );
    } catch (error) {
      console.error('[NeuralAdaptiveEngine] Erro ao salvar modelos:', error);
    }
  }

  optimizeForPeakUsage() {
    return true;
  }

  applyActiveAdaptations() {}
  isSignificantElement() {}
  isSignificantAttribute() {}
  adjustForLowBandwidth() {}
  adjustForLowBattery() {}
  adjustForTimeOfDay() {}
  evaluateSectionSpecificAdaptations() {}
  applyElementEmphasis() {}
  createQuickActions() {}
  createWorkflowShortcut() {}
  optimizeNavigationPath() {}
  applyDensityPreference() {}
  applyAnimationLevel() {}
}

export default NeuralAdaptiveEngine;
