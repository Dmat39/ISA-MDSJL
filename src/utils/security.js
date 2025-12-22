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
 * Detecta el sistema operativo del usuario
 * @returns {Object} { isIOS: boolean, isAndroid: boolean, isMobile: boolean, browser: string }
 */
export const detectOS = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);
  const isMobile = isIOS || isAndroid;

  // Detectar navegador en iOS
  let browser = 'unknown';
  if (isIOS) {
    if (/CriOS/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/FxiOS/i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/Safari/i.test(userAgent)) {
      browser = 'Safari';
    }
  } else if (isAndroid) {
    if (/Chrome/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/Firefox/i.test(userAgent)) {
      browser = 'Firefox';
    }
  }

  return {
    isIOS,
    isAndroid,
    isMobile,
    browser,
    userAgent
  };
};

/**
 * Genera mensaje de ayuda contextual para permisos de ubicación según SO
 * @param {string} errorType - Tipo de error: 'denied' | 'unavailable' | 'timeout'
 * @returns {string} Mensaje de ayuda contextual
 */
export const getLocationPermissionMessage = (errorType = 'denied') => {
  const { isIOS, isAndroid, browser } = detectOS();

  if (errorType === 'denied') {
    if (isIOS) {
      if (browser === 'Safari') {
        return 'Para usar esta función, permite el acceso a tu ubicación. Ve a: Configuración > Safari > Ubicación > Permitir.';
      } else if (browser === 'Chrome') {
        return 'Para usar esta función, permite el acceso a tu ubicación. Ve a: Configuración > Chrome > Ubicación > Permitir.';
      }
      return 'Para usar esta función, permite el acceso a tu ubicación en la configuración de iOS.';
    } else if (isAndroid) {
      if (browser === 'Chrome') {
        return 'Para usar esta función, permite el acceso a tu ubicación. Ve a: Configuración > Aplicaciones > Chrome > Permisos > Ubicación.';
      } else if (browser === 'Firefox') {
        return 'Para usar esta función, permite el acceso a tu ubicación. Ve a: Configuración > Aplicaciones > Firefox > Permisos > Ubicación.';
      }
      return 'Para usar esta función, permite el acceso a tu ubicación en la configuración de Android.';
    }
    return 'Para usar esta función, permite el acceso a tu ubicación en la configuración de tu navegador.';
  }

  if (errorType === 'unavailable') {
    return 'No se puede determinar tu ubicación. Verifica que tengas GPS activado y buena señal.';
  }

  if (errorType === 'timeout') {
    return 'La solicitud de ubicación tardó demasiado. Intenta de nuevo o verifica tu conexión.';
  }

  return 'Ocurrió un error inesperado. Intenta recargar la página.';
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
