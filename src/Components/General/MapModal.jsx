import React, { useState, useCallback } from 'react';
import { Modal, Box, IconButton, Button } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { X, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Solucionar problema con los íconos de los marcadores
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente para manejar clics en el mapa
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onLocationSelect(lat, lng);
        },
    });
    return null;
};

const MapModal = ({ open, onClose, latitude, longitude, address, onLocationSelect }) => {
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [loading, setLoading] = useState(false);
    
    const position = [latitude || -12.0464, longitude || -77.0428];
    const displayPosition = selectedPosition || position;

    // Función para obtener dirección de coordenadas
    const getAddressFromCoords = useCallback(async (lat, lng) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
                {
                    headers: {
                        'User-Agent': 'IncidenciasApp/1.0 (Leaflet Compatible)'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                
                // Construir dirección más legible
                let readableAddress = '';
                if (data.address) {
                    const parts = [];
                    if (data.address.road) parts.push(data.address.road);
                    if (data.address.house_number) parts.push(data.address.house_number);
                    if (data.address.suburb) parts.push(data.address.suburb);
                    if (data.address.city_district) parts.push(data.address.city_district);
                    if (data.address.city) parts.push(data.address.city);
                    
                    readableAddress = parts.join(', ') || data.display_name;
                }
                
                return readableAddress || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
            }
        } catch (err) {
            console.warn('Error obteniendo dirección:', err);
        }
        
        setLoading(false);
        return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }, []);

    // Manejar selección de nueva ubicación
    const handleLocationSelect = useCallback(async (lat, lng) => {
        console.log('Nueva ubicación seleccionada:', { lat, lng });
        setSelectedPosition([lat, lng]);
        
        const newAddress = await getAddressFromCoords(lat, lng);
        setSelectedAddress(newAddress);
        setLoading(false);
    }, [getAddressFromCoords]);

    // Confirmar nueva ubicación
    const handleConfirmLocation = () => {
        if (selectedPosition && onLocationSelect) {
            const [lat, lng] = selectedPosition;
            onLocationSelect({
                latitude: lat,
                longitude: lng,
                address: selectedAddress
            });
        }
        onClose();
    };

    // Resetear al cerrar
    const handleClose = () => {
        setSelectedPosition(null);
        setSelectedAddress('');
        setLoading(false);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
        >
            <Box
                sx={{
                    width: '90vw',
                    height: '85vh',
                    maxWidth: '800px',
                    maxHeight: '700px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header del modal */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {selectedPosition ? 'Nueva Ubicación Seleccionada' : 'Ubicación Actual'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {selectedPosition ? 'Haz clic en "Confirmar" para usar esta ubicación' : 'Haz clic en el mapa para seleccionar una nueva ubicación'}
                        </p>
                    </div>
                    <IconButton
                        onClick={handleClose}
                        size="small"
                        sx={{
                            color: 'gray',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        <X className="w-5 h-5" />
                    </IconButton>
                </div>

                {/* Contenedor del mapa */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {latitude && longitude ? (
                        <MapContainer
                            center={position}
                            zoom={16}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            
                            {/* Handler para clics en el mapa */}
                            <MapClickHandler onLocationSelect={handleLocationSelect} />
                            
                            {/* Marcador de la ubicación */}
                            <Marker position={displayPosition}>
                                <Popup>
                                    <div className="text-sm max-w-[250px]">
                                        <h3 className="font-semibold text-gray-800 mb-2">
                                            {selectedPosition ? 'Nueva ubicación' : 'Ubicación actual'}
                                        </h3>
                                        <p className="text-gray-600 text-xs">
                                            {selectedPosition 
                                                ? (loading ? 'Obteniendo dirección...' : selectedAddress)
                                                : (address || 'Dirección no disponible')
                                            }
                                        </p>
                                        <div className="mt-2 text-xs text-gray-500">
                                            <p>Lat: {displayPosition[0]?.toFixed(6)}</p>
                                            <p>Lng: {displayPosition[1]?.toFixed(6)}</p>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-600">
                                    No se pudo obtener la ubicación
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con botones */}
                {selectedPosition && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSelectedPosition(null);
                                    setSelectedAddress('');
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleConfirmLocation}
                                disabled={loading}
                                sx={{ 
                                    textTransform: 'none',
                                    backgroundColor: '#10b981',
                                    '&:hover': {
                                        backgroundColor: '#059669'
                                    }
                                }}
                            >
                                {loading ? 'Obteniendo dirección...' : 'Confirmar Ubicación'}
                            </Button>
                        </div>
                    </div>
                )}
            </Box>
        </Modal>
    );
};

export default MapModal;