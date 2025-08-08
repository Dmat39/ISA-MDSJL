import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Solucionar problema con los íconos de los marcadores
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapaIncidencias = ({ data }) => {
    const position = [-12.0464, -77.0428]; // Lima, Perú

    return (
        <div className='flex flex-col flex-1 bg-amber-100 overflow-hidden rounded-lg border border-gray-300 shadow-xs'>
            <MapContainer center={position} zoom={13} style={{ flex: 1 }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MarkerClusterGroup chunkedLoading>
                    {data.map(punto => (
                        <Marker
                            key={punto.id}
                            position={[parseFloat(punto.latitud), parseFloat(punto.longitud)]}
                        >
                            <Popup>
                                <div className="text-[13px] max-w-[240px]">
                                    <h3 className="text-[14px] font-semibold text-gray-800 mb-1">Pre-Incidencia</h3>
                                    <div className="text-[12px] text-gray-700 space-y-1">
                                        <p className='!m-0'><span className="font-bold">Descripción:</span> {punto.descripcion}</p>
                                        <p className='!m-0'><span className="font-bold">Fecha:</span> {punto.fecha_ocurrencia || "-"}</p>
                                        <p className='!m-0'><span className="font-bold">Hora:</span> {punto.hora_ocurrencia || "-"}</p>
                                        <p className='!m-0'><span className="font-bold">Dirección:</span> {punto.direccion || "-"}</p>
                                        <p className='!m-0'><span className="font-bold">Estado:</span> {punto.estado || "-"}</p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>

                <FitBounds puntos={data} />
            </MapContainer>
        </div>
    );
};

const FitBounds = ({ puntos }) => {
    const map = useMap();

    useEffect(() => {
        if (puntos.length === 0) return;

        const bounds = L.latLngBounds(
            puntos.map(p => [parseFloat(p.latitud), parseFloat(p.longitud)])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [puntos, map]);

    return null;
};

export default MapaIncidencias;
