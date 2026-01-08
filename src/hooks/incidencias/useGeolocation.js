import { useState, useEffect, useCallback } from 'react';
import { getLocationPermissionMessage } from '../../utils/security';

// Utilidad para cache de geocodificación
const GEOCACHE_PREFIX = 'geocache_';
const GEOCACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

const getCachedAddress = (latitude, longitude) => {
    // Redondear a 4 decimales (~11 metros de precisión) para agrupar ubicaciones cercanas
    const roundedLat = latitude.toFixed(4);
    const roundedLng = longitude.toFixed(4);
    const cacheKey = `${GEOCACHE_PREFIX}${roundedLat}_${roundedLng}`;

    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { address, timestamp } = JSON.parse(cached);
            const now = Date.now();

            // Verificar si el cache expiró
            if (now - timestamp < GEOCACHE_TTL) {
                console.log('✅ Dirección obtenida del caché:', address);
                return address;
            } else {
                // Limpiar cache expirado
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (err) {
        console.warn('Error leyendo cache de geocodificación:', err);
    }

    return null;
};

const setCachedAddress = (latitude, longitude, address) => {
    const roundedLat = latitude.toFixed(4);
    const roundedLng = longitude.toFixed(4);
    const cacheKey = `${GEOCACHE_PREFIX}${roundedLat}_${roundedLng}`;

    try {
        localStorage.setItem(cacheKey, JSON.stringify({
            address,
            timestamp: Date.now()
        }));
        console.log('💾 Dirección guardada en caché');
    } catch (err) {
        console.warn('Error guardando cache de geocodificación:', err);
        // Si falla (por ejemplo, localStorage lleno), continuar sin cache
    }
};

const useGeolocation = () => {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        address: '',
        loading: true,
        error: null,
        permissionStatus: null
    });

    const getAddressFromCoords = async (latitude, longitude) => {
        // Verificar cache primero
        const cachedAddress = getCachedAddress(latitude, longitude);
        if (cachedAddress) {
            return cachedAddress;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=es`,
                {
                    headers: {
                        'User-Agent': 'IncidenciasApp/1.0 (Leaflet Compatible)'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();

                // Construir dirección más detallada y legible
                let readableAddress = '';
                if (data.address) {
                    const parts = [];

                    // Agregar número de casa si existe
                    if (data.address.house_number) {
                        parts.push(data.address.house_number);
                    }

                    // Agregar calle
                    if (data.address.road) {
                        parts.push(data.address.road);
                    }

                    // Agregar tipo de vía (avenida, calle, etc.)
                    if (data.address.highway && data.address.highway !== data.address.road) {
                        parts.push(data.address.highway);
                    }

                    // Agregar barrio/distrito
                    if (data.address.suburb) {
                        parts.push(data.address.suburb);
                    }

                    // Agregar distrito de la ciudad
                    if (data.address.city_district) {
                        parts.push(data.address.city_district);
                    }

                    // Agregar ciudad
                    if (data.address.city) {
                        parts.push(data.address.city);
                    }

                    // Agregar provincia/estado
                    if (data.address.state) {
                        parts.push(data.address.state);
                    }

                    // Agregar país
                    if (data.address.country) {
                        parts.push(data.address.country);
                    }

                    // Si no tenemos suficientes partes, usar display_name
                    if (parts.length < 2) {
                        readableAddress = data.display_name;
                    } else {
                        readableAddress = parts.join(', ');
                    }
                } else {
                    readableAddress = data.display_name;
                }

                console.log('🌐 Dirección obtenida de Nominatim:', readableAddress);

                // Guardar en cache para futuras consultas
                setCachedAddress(latitude, longitude, readableAddress);

                return readableAddress;
            }
        } catch (err) {
            console.warn('Error obteniendo dirección detallada:', err);
        }

        // Fallback a coordenadas si no se puede obtener dirección
        return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
    };

    // Verificar permisos de geolocalización
    const checkGeolocationPermission = useCallback(async () => {
        // Verificar si la API de permisos está disponible
        if ('permissions' in navigator) {
            try {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                console.log('Estado del permiso de geolocalización:', permission.state);
                
                setLocation(prev => ({ ...prev, permissionStatus: permission.state }));
                
                // Escuchar cambios en el permiso
                permission.addEventListener('change', () => {
                    console.log('Cambio en permiso de geolocalización:', permission.state);
                    setLocation(prev => ({ ...prev, permissionStatus: permission.state }));
                });
                
                return permission.state;
            } catch (err) {
                console.warn('Error al verificar permisos:', err);
            }
        }
        return null;
    }, []);

    const getCurrentLocation = useCallback(async () => {
        console.log('🔄 Iniciando solicitud de geolocalización...');
        setLocation(prev => ({ ...prev, loading: true, error: null }));

        // Verificar soporte de geolocalización
        if (!navigator.geolocation) {
            const errorMsg = 'Tu navegador no soporta geolocalización';
            console.error('❌', errorMsg);
            setLocation(prev => ({
                ...prev,
                loading: false,
                error: errorMsg,
                permissionStatus: 'denied'
            }));
            return;
        }

        // Verificar permisos antes de solicitar ubicación
        const permissionStatus = await checkGeolocationPermission();

        if (permissionStatus === 'denied') {
            const errorMsg = getLocationPermissionMessage('denied');
            console.error('❌', errorMsg);
            setLocation(prev => ({
                ...prev,
                loading: false,
                error: errorMsg,
                permissionStatus: 'denied'
            }));
            return;
        }

        // ESTRATEGIA ADAPTATIVA: Intentar primero con baja precisión (rápido)
        // Si falla o es muy impreciso, intentar con alta precisión

        // Configuración para PRIMER INTENTO (rápido, optimizado para móviles con datos)
        const quickOptions = {
            enableHighAccuracy: false, // Usa torres celulares/WiFi (más rápido)
            timeout: 8000, // 8 segundos
            maximumAge: 60000 // 1 minuto de cache
        };

        // Configuración para SEGUNDO INTENTO (preciso, si el primero falla o es impreciso)
        const preciseOptions = {
            enableHighAccuracy: true, // Usa GPS (más lento pero preciso)
            timeout: 15000, // 15 segundos para esperar GPS
            maximumAge: 0 // No usar cache
        };

        console.log('📍 Intento 1: Ubicación rápida (torres celulares/WiFi)...');

        // PRIMER INTENTO: Ubicación rápida
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                console.log('✅ Ubicación obtenida (intento rápido):', {
                    latitude,
                    longitude,
                    accuracy: Math.round(accuracy) + 'm'
                });

                // Si la precisión es muy mala (>500m), intentar con GPS
                if (accuracy > 500) {
                    console.log('⚠️ Precisión baja (' + Math.round(accuracy) + 'm), intentando GPS...');

                    // SEGUNDO INTENTO: GPS preciso (en background)
                    navigator.geolocation.getCurrentPosition(
                        async (betterPosition) => {
                            const betterAccuracy = betterPosition.coords.accuracy;
                            console.log('✅ GPS mejorado obtenido:', {
                                latitude: betterPosition.coords.latitude,
                                longitude: betterPosition.coords.longitude,
                                accuracy: Math.round(betterAccuracy) + 'm'
                            });

                            // Actualizar con la posición mejorada
                            setLocation({
                                latitude: betterPosition.coords.latitude,
                                longitude: betterPosition.coords.longitude,
                                address: 'Obteniendo dirección...',
                                loading: false,
                                error: null,
                                permissionStatus: 'granted'
                            });

                            try {
                                const detailedAddress = await getAddressFromCoords(
                                    betterPosition.coords.latitude,
                                    betterPosition.coords.longitude
                                );
                                setLocation(prev => ({
                                    ...prev,
                                    address: detailedAddress
                                }));
                            } catch (addressError) {
                                console.warn('Error obteniendo dirección:', addressError);
                                setLocation(prev => ({
                                    ...prev,
                                    address: `Lat: ${betterPosition.coords.latitude.toFixed(6)}, Lng: ${betterPosition.coords.longitude.toFixed(6)}`
                                }));
                            }
                        },
                        (gpsError) => {
                            // Si GPS falla, mantener la ubicación aproximada
                            console.warn('⚠️ GPS no disponible, usando ubicación aproximada');
                        },
                        preciseOptions
                    );
                }

                // Establecer coordenadas inmediatamente (aunque sean aproximadas)
                setLocation({
                    latitude,
                    longitude,
                    address: 'Obteniendo dirección...',
                    loading: false,
                    error: null,
                    permissionStatus: 'granted'
                });

                try {
                    // Obtener dirección detallada
                    const detailedAddress = await getAddressFromCoords(latitude, longitude);

                    // Actualizar con la dirección detallada
                    setLocation(prev => ({
                        ...prev,
                        address: detailedAddress
                    }));

                    console.log('Dirección actualizada:', detailedAddress);
                } catch (addressError) {
                    console.warn('Error obteniendo dirección:', addressError);
                    // Mantener coordenadas pero con dirección fallback
                    setLocation(prev => ({
                        ...prev,
                        address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
                    }));
                }
            },
            (error) => {
                // Si falla el intento rápido, intentar directamente con GPS
                console.warn('⚠️ Ubicación rápida falló, intentando con GPS...');

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude, accuracy } = position.coords;

                        console.log('✅ Ubicación GPS obtenida:', {
                            latitude,
                            longitude,
                            accuracy: Math.round(accuracy) + 'm'
                        });

                        setLocation({
                            latitude,
                            longitude,
                            address: 'Obteniendo dirección...',
                            loading: false,
                            error: null,
                            permissionStatus: 'granted'
                        });

                        try {
                            const detailedAddress = await getAddressFromCoords(latitude, longitude);
                            setLocation(prev => ({
                                ...prev,
                                address: detailedAddress
                            }));
                        } catch (addressError) {
                            console.warn('Error obteniendo dirección:', addressError);
                            setLocation(prev => ({
                                ...prev,
                                address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
                            }));
                        }
                    },
                    (gpsError) => {
                        // Ambos intentos fallaron
                        let errorMessage = 'Error al obtener ubicación';
                        let userFriendlyMessage = '';

                        switch (gpsError.code) {
                            case gpsError.PERMISSION_DENIED:
                                errorMessage = 'Permiso de ubicación denegado';
                                userFriendlyMessage = getLocationPermissionMessage('denied');
                                break;
                            case gpsError.POSITION_UNAVAILABLE:
                                errorMessage = 'Ubicación no disponible';
                                userFriendlyMessage = getLocationPermissionMessage('unavailable');
                                break;
                            case gpsError.TIMEOUT:
                                errorMessage = 'Tiempo de espera agotado. Verifique su conexión y que el GPS esté activado.';
                                userFriendlyMessage = getLocationPermissionMessage('timeout');
                                break;
                            default:
                                errorMessage = 'Error desconocido al obtener ubicación';
                                userFriendlyMessage = getLocationPermissionMessage('unknown');
                                break;
                        }

                        console.error('❌ Error de geolocalización:', {
                            code: gpsError.code,
                            message: gpsError.message,
                            userMessage: userFriendlyMessage
                        });

                        setLocation(prev => ({
                            ...prev,
                            loading: false,
                            error: userFriendlyMessage,
                            permissionStatus: gpsError.code === gpsError.PERMISSION_DENIED ? 'denied' : 'granted'
                        }));
                    },
                    preciseOptions
                );
            },
            quickOptions
        );
    }, [checkGeolocationPermission]);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    return {
        ...location,
        refetch: getCurrentLocation,
        requestPermission: getCurrentLocation
    };
};

export default useGeolocation;