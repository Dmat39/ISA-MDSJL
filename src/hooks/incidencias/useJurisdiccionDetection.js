import { useState, useEffect } from 'react';
import * as turf from '@turf/turf';

const useJurisdiccionDetection = () => {
  const [jurisdicciones, setJurisdicciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // LAZY LOADING: Solo cargar cuando se necesite (no al montar)
  const loadJurisdiccionesIfNeeded = async () => {
    // Si ya están cargadas, no hacer nada
    if (isLoaded || loading) {
      return;
    }

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
        setJurisdicciones(data.data);
        setIsLoaded(true);
      } else {
        throw new Error('Formato de datos inválido en el archivo GeoJSON');
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('💥 Error cargando jurisdicciones:', err);
      }
      setError('Error al cargar las jurisdicciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para detectar la jurisdicción basada en coordenadas
  const detectarJurisdiccion = (latitude, longitude) => {
    if (!jurisdicciones.length) {
      if (import.meta.env.DEV) {
        console.warn('No hay jurisdicciones cargadas');
      }
      return null;
    }

    try {
      const punto = turf.point([longitude, latitude]);

      // Buscar en qué jurisdicción se encuentra el punto
      for (const jurisdiccion of jurisdicciones) {
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
    await loadJurisdiccionesIfNeeded();

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const jurisdiccion = detectarJurisdiccion(latitude, longitude);
            
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
        (err) => {
          setLoading(false);
          /* let errorMessage = 'Error obteniendo ubicación'; */
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible';
              break;
            case err.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado';
              break;
          }
          
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: false, // Cambiar a false para evitar errores
          timeout: 15000, // Aumentar timeout
          maximumAge: 60000
        }
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