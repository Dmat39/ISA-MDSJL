import { useState, useEffect } from 'react';

const useGeolocation = () => {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        address: '',
        loading: true,
        error: null
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

    const getCurrentLocation = () => {
        setLocation(prev => ({ ...prev, loading: true, error: null }));

        if (!navigator.geolocation) {
            setLocation(prev => ({
                ...prev,
                loading: false,
                error: 'Geolocalización no soportada por este navegador'
            }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                console.log('Ubicación obtenida:', { latitude, longitude });
                
                // Establecer coordenadas inmediatamente con placeholder
                setLocation({
                    latitude,
                    longitude,
                    address: 'Obteniendo dirección...',
                    loading: false,
                    error: null
                });

                // Obtener dirección detallada
                const detailedAddress = await getAddressFromCoords(latitude, longitude);
                
                // Actualizar con la dirección detallada
                setLocation(prev => ({
                    ...prev,
                    address: detailedAddress
                }));
            },
            (error) => {
                let errorMessage = 'Error al obtener ubicación';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permiso de ubicación denegado';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Ubicación no disponible';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Tiempo de espera agotado';
                        break;
                    default:
                        errorMessage = 'Error desconocido al obtener ubicación';
                        break;
                }
                
                setLocation(prev => ({
                    ...prev,
                    loading: false,
                    error: errorMessage
                }));
            },
            {
                enableHighAccuracy: true, // Cambiar a true para mejor precisión
                timeout: 20000, // Aumentar timeout a 20 segundos
                maximumAge: 300000 // 5 minutos
            }
        );
    };

    useEffect(() => {
        getCurrentLocation();
    }, []);

    return {
        ...location,
        refetch: getCurrentLocation
    };
};

export default useGeolocation;