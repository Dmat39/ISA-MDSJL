import { useState, useEffect, useRef } from 'react';
import * as turf from '@turf/turf';

const useJurisdiccionDetection = () => {
  const [jurisdicciones, setJurisdicciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Ref para rastrear la promesa de carga (no usar useState para promesas)
  const loadingPromiseRef = useRef(null);

  // Ref para almacenar los datos inmediatamente (sin esperar setState)
  const jurisdiccionesDataRef = useRef([]);

  // LAZY LOADING: Solo cargar cuando se necesite (no al montar)
  const loadJurisdiccionesIfNeeded = async () => {
    // Si ya están cargadas, retornar los datos inmediatamente
    if (isLoaded && jurisdiccionesDataRef.current.length > 0) {
      return Promise.resolve(jurisdiccionesDataRef.current);
    }

    // Si ya hay una carga en progreso, esperar a que termine
    if (loadingPromiseRef.current) {
      return loadingPromiseRef.current;
    }

    // Crear nueva promesa de carga
    const promise = (async () => {
      try {
        setLoading(true);
        if (import.meta.env.DEV) {
          console.log('🌍 Cargando jurisdicciones (lazy loading)...');
        }

        const response = await fetch('/Data/juridiccion.geojson');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status && data.data) {
          if (import.meta.env.DEV) {
            console.log('✅ Jurisdicciones cargadas:', data.data.length);
          }

          // Guardar en ref INMEDIATAMENTE (no espera re-render)
          jurisdiccionesDataRef.current = data.data;

          // Actualizar estado (para UI)
          setJurisdicciones(data.data);
          setIsLoaded(true);

          // RETORNAR los datos directamente
          return data.data;
        } else {
          throw new Error('Formato de datos inválido en el archivo GeoJSON');
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('💥 Error cargando jurisdicciones:', err);
        }
        setError('Error al cargar las jurisdicciones: ' + err.message);
        throw err; // Propagar el error para que el llamador lo maneje
      } finally {
        setLoading(false);
        loadingPromiseRef.current = null; // Limpiar la promesa al terminar
      }
    })();

    loadingPromiseRef.current = promise;
    return promise;
  };

  // Función para detectar la jurisdicción basada en coordenadas
  // Acepta jurisdicciones como parámetro opcional (para evitar problemas de setState asíncrono)
  const detectarJurisdiccion = (latitude, longitude, jurisdiccionesData = null) => {
    // Usar jurisdicciones pasadas como parámetro, o el ref, o el estado
    const dataToUse = jurisdiccionesData || jurisdiccionesDataRef.current || jurisdicciones;

    if (!dataToUse.length) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No hay jurisdicciones cargadas');
      }
      return null;
    }

    try {
      const punto = turf.point([longitude, latitude]);

      // Buscar en qué jurisdicción se encuentra el punto
      for (const jurisdiccion of dataToUse) {
        if (jurisdiccion.geometry && jurisdiccion.geometry.coordinates) {
          try {
            const poligono = turf.polygon(jurisdiccion.geometry.coordinates);

            if (turf.booleanPointInPolygon(punto, poligono)) {
              if (import.meta.env.DEV) {
                console.log('✅ Jurisdicción encontrada:', jurisdiccion.name);
              }
              return {
                id: jurisdiccion.id,
                name: jurisdiccion.name,
                description: jurisdiccion.description,
                color: jurisdiccion.color
              };
            }
          } catch (geoErr) {
            if (import.meta.env.DEV) {
              console.warn('Error procesando geometría:', jurisdiccion.name, geoErr);
            }
          }
        }
      }

      return null; // No se encontró jurisdicción
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error detectando jurisdicción:', err);
      }
      return null;
    }
  };

  // Función para obtener coordenadas GPS y detectar jurisdicción automáticamente
  const obtenerJurisdiccionActual = async () => {
    // LAZY LOADING: Cargar jurisdicciones solo cuando se necesiten
    // RETORNA los datos cargados directamente
    const jurisdiccionesData = await loadJurisdiccionesIfNeeded();

    if (import.meta.env.DEV) {
      console.log('📊 Jurisdicciones disponibles para detección:', jurisdiccionesData?.length || 0);
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      setLoading(true);
      setError(null);

      // Configuración optimizada para móviles (igual que useGeolocation)
      const quickOptions = {
        enableHighAccuracy: false, // Usa torres celulares/WiFi (más rápido)
        timeout: 8000,
        maximumAge: 60000
      };

      const preciseOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      // PRIMER INTENTO: Ubicación rápida
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          if (import.meta.env.DEV) {
            console.log('✅ Ubicación obtenida para jurisdicción:', {
              latitude,
              longitude,
              accuracy: Math.round(accuracy) + 'm'
            });
          }

          // Si la precisión es muy mala (>500m), intentar con GPS
          if (accuracy > 500) {
            if (import.meta.env.DEV) {
              console.log('⚠️ Precisión baja, intentando GPS para mejor detección de jurisdicción...');
            }

            navigator.geolocation.getCurrentPosition(
              (betterPosition) => {
                const { latitude: betterLat, longitude: betterLng } = betterPosition.coords;

                try {
                  // Pasar jurisdiccionesData directamente
                  const jurisdiccion = detectarJurisdiccion(betterLat, betterLng, jurisdiccionesData);
                  setLoading(false);
                  resolve({
                    coordinates: { latitude: betterLat, longitude: betterLng },
                    jurisdiccion
                  });
                } catch (err) {
                  console.error('Error detectando jurisdicción:', err);
                  setLoading(false);
                  setError('Error al detectar jurisdicción');
                  reject(err);
                }
              },
              (gpsError) => {
                // Si GPS falla, usar la ubicación aproximada
                if (import.meta.env.DEV) {
                  console.warn('⚠️ GPS no disponible, usando ubicación aproximada');
                }

                try {
                  // Pasar jurisdiccionesData directamente
                  const jurisdiccion = detectarJurisdiccion(latitude, longitude, jurisdiccionesData);
                  setLoading(false);
                  resolve({
                    coordinates: { latitude, longitude },
                    jurisdiccion
                  });
                } catch (err) {
                  console.error('Error detectando jurisdicción:', err);
                  setLoading(false);
                  setError('Error al detectar jurisdicción');
                  reject(err);
                }
              },
              preciseOptions
            );
          } else {
            // Precisión aceptable, usar esta ubicación
            try {
              // Pasar jurisdiccionesData directamente
              const jurisdiccion = detectarJurisdiccion(latitude, longitude, jurisdiccionesData);
              setLoading(false);
              resolve({
                coordinates: { latitude, longitude },
                jurisdiccion
              });
            } catch (err) {
              console.error('Error detectando jurisdicción:', err);
              setLoading(false);
              setError('Error al detectar jurisdicción');
              reject(err);
            }
          }
        },
        (err) => {
          // Si falla el intento rápido, intentar con GPS
          if (import.meta.env.DEV) {
            console.warn('⚠️ Ubicación rápida falló, intentando con GPS...');
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;

              try {
                // Pasar jurisdiccionesData directamente
                const jurisdiccion = detectarJurisdiccion(latitude, longitude, jurisdiccionesData);
                setLoading(false);
                resolve({
                  coordinates: { latitude, longitude },
                  jurisdiccion
                });
              } catch (detectErr) {
                console.error('Error detectando jurisdicción:', detectErr);
                setLoading(false);
                setError('Error al detectar jurisdicción');
                reject(detectErr);
              }
            },
            (gpsErr) => {
              // Ambos intentos fallaron
              setLoading(false);
              let errorMessage = 'Error obteniendo ubicación';

              switch (gpsErr.code) {
                case gpsErr.PERMISSION_DENIED:
                  errorMessage = 'Permiso de ubicación denegado';
                  break;
                case gpsErr.POSITION_UNAVAILABLE:
                  errorMessage = 'Ubicación no disponible';
                  break;
                case gpsErr.TIMEOUT:
                  errorMessage = 'Tiempo de espera agotado. Verifique su conexión y que el GPS esté activado.';
                  break;
              }

              setError(errorMessage);
              reject(new Error(errorMessage));
            },
            preciseOptions
          );
        },
        quickOptions
      );
    });
  };

  return {
    jurisdicciones,
    detectarJurisdiccion,
    obtenerJurisdiccionActual,
    loadJurisdiccionesIfNeeded, // Exponer para lazy loading manual
    loading,
    error
  };
};

export default useJurisdiccionDetection;