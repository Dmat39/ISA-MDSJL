import { useState, useEffect, useCallback } from 'react';

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
                
                console.log('Dirección detallada obtenida:', readableAddress);
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
            const errorMsg = 'Los permisos de ubicación están bloqueados. Ve a Configuración > Safari > Ubicación para habilitarlos.';
            console.error('❌', errorMsg);
            setLocation(prev => ({
                ...prev,
                loading: false,
                error: errorMsg,
                permissionStatus: 'denied'
            }));
            return;
        }

        // Configuración optimizada para iOS
        const options = {
            enableHighAccuracy: true,
            timeout: 20000, // 20 segundos para iOS
            maximumAge: 60000 // 1 minuto de cache
        };

        console.log('📍 Solicitando ubicación con opciones:', options);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                
                console.log('Ubicación obtenida:', { 
                    latitude, 
                    longitude, 
                    accuracy: Math.round(accuracy) + 'm' 
                });
                
                // Establecer coordenadas inmediatamente con placeholder
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
                let errorMessage = 'Error al obtener ubicación';
                let userFriendlyMessage = '';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permiso de ubicación denegado';
                        userFriendlyMessage = 'Para usar esta función, permite el acceso a tu ubicación. En iOS: Configuración > Safari > Ubicación > Permitir.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Ubicación no disponible';
                        userFriendlyMessage = 'No se puede determinar tu ubicación. Verifica que tengas GPS activado y buena señal.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Tiempo de espera agotado';
                        userFriendlyMessage = 'La solicitud de ubicación tardó demasiado. Intenta de nuevo o verifica tu conexión.';
                        break;
                    default:
                        errorMessage = 'Error desconocido al obtener ubicación';
                        userFriendlyMessage = 'Ocurrió un error inesperado. Intenta recargar la página.';
                        break;
                }
                
                console.error('❌ Error de geolocalización:', {
                    code: error.code,
                    message: error.message,
                    userMessage: userFriendlyMessage
                });
                
                setLocation(prev => ({
                    ...prev,
                    loading: false,
                    error: userFriendlyMessage,
                    permissionStatus: error.code === error.PERMISSION_DENIED ? 'denied' : 'granted'
                }));
            },
            options
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