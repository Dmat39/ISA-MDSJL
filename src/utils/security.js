// Utilidades de seguridad para proteger la aplicación en producción

/**
 * Deshabilita console.log, console.warn, console.error en producción
 * para evitar que se filtre información sensible
 */
export const disableConsoleInProduction = () => {
  if (!import.meta.env.DEV) {
    const noop = () => { };
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
  }
};

/**
 * Detecta si las DevTools están abiertas y ejecuta una acción
 * NOTA: Esto es solo una medida disuasiva, no es 100% efectiva
 */
export const detectDevTools = (callback) => {
  if (import.meta.env.DEV) return; // No ejecutar en desarrollo

  const devtools = {
    isOpen: false,
    orientation: undefined
  };

  const threshold = 160;

  const emitEvent = (isOpen, orientation) => {
    globalThis.dispatchEvent(
      new CustomEvent('devtoolschange', {
        detail: {
          isOpen,
          orientation
        }
      })
    );
  };

  const main = () => {
    const widthThreshold = globalThis.outerWidth - globalThis.innerWidth > threshold;
    const heightThreshold = globalThis.outerHeight - globalThis.innerHeight > threshold;
    const orientation = widthThreshold ? 'vertical' : 'horizontal';

    if (
      !(heightThreshold && widthThreshold) &&
      ((globalThis.Firebug && globalThis.Firebug.chrome && globalThis.Firebug.chrome.isInitialized) ||
        widthThreshold ||
        heightThreshold)
    ) {
      if (!devtools.isOpen || devtools.orientation !== orientation) {
        emitEvent(true, orientation);
        devtools.isOpen = true;
        devtools.orientation = orientation;
      }
    } else {
      if (devtools.isOpen) {
        emitEvent(false, undefined);
        devtools.isOpen = false;
        devtools.orientation = undefined;
      }
    }
  };

  setInterval(main, 500);

  if (callback) {
    globalThis.addEventListener('devtoolschange', callback);
  }
};

/**
 * Previene clic derecho (inspeccionar elemento)
 * ADVERTENCIA: Esto puede afectar la experiencia del usuario
 */
export const disableRightClick = () => {
  if (import.meta.env.DEV) return; // No ejecutar en desarrollo

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
};

/**
 * Previene atajos de teclado comunes de DevTools
 * ADVERTENCIA: Esto puede afectar la experiencia del usuario
 */
export const disableDevToolsShortcuts = () => {
  if (import.meta.env.DEV) return; // No ejecutar en desarrollo

  document.addEventListener('keydown', (e) => {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I / Cmd+Option+I
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U / Cmd+U (Ver código fuente)
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C / Cmd+Option+C (Selector de elementos)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      return false;
    }
  });
};

/**
 * Limpia el localStorage de información sensible al cerrar sesión
 */
export const clearSensitiveData = () => {
  // Mantener solo datos no sensibles si es necesario
  const nonSensitiveKeys = ['theme', 'language']; // Ejemplo

  const savedData = {};
  nonSensitiveKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) savedData[key] = value;
  });

  localStorage.clear();

  Object.keys(savedData).forEach(key => {
    localStorage.setItem(key, savedData[key]);
  });
};

/**
 * Inicializa todas las medidas de seguridad
 * Llamar esta función al inicio de la aplicación
 */
export const initSecurityMeasures = (options = {}) => {
  const {
    disableConsole = true,
    detectDevTools: enableDevToolsDetection = false,
    disableRightClick: enableDisableRightClick = false,
    disableShortcuts = false,
    onDevToolsOpen = null
  } = options;

  if (disableConsole) {
    disableConsoleInProduction();
  }

  if (enableDevToolsDetection && onDevToolsOpen) {
    detectDevTools((e) => {
      if (e.detail.isOpen) {
        onDevToolsOpen();
      }
    });
  }

  if (enableDisableRightClick) {
    disableRightClick();
  }

  if (disableShortcuts) {
    disableDevToolsShortcuts();
  }
};
