import Zoom from 'react-medium-image-zoom'
import { getEstadoBadge } from "../../utils/uiUtils";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import CustomModal from "../../Components/General/CustomModal";
import 'react-medium-image-zoom/dist/styles.css'

const DetalleIncidencia = ({ open, handleClose, data }) => {

    return (
        <CustomModal Open={open} handleClose={handleClose} className='w-[95%] max-w-lg rounded-md text-black'>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Detalle de la incidencia</h2>
                    <div
                        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${getEstadoBadge(data?.estado).className}`}
                    >
                        {getEstadoBadge(data?.estado).icon}
                        <span className="capitalize">{data?.estado?.toLowerCase()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-700">
                    <div className="sm:col-span-2">
                        <span className="font-medium text-gray-900">Tipo Caso:</span> <br />
                        {data?.tipo?.nombre}
                    </div>
                    <div className="sm:col-span-2">
                        <span className="font-medium text-gray-900">SubTipo Caso: </span><br />
                        {data?.subtipo?.nombre}
                    </div>
                    <div>
                        <span className="font-medium text-gray-900">Fecha de incidencia: </span>
                        {data?.fecha_ocurrencia}
                    </div>
                    <div>
                        <span className="font-medium text-gray-900">Hora de incidencia: </span>
                        {data?.hora_ocurrencia}
                    </div>
                    <div className="sm:col-span-2">
                        <span className="font-medium text-gray-900">Descripción: </span>
                        {data?.descripcion}
                    </div>
                </div>

                {/* Mapa */}

                <div className="bg-gray-500 rounded-lg overflow-hidden aspect-video flex">
                    <MapContainer center={[data?.latitud, data?.longitud]} zoom={13} style={{ flex: 1 }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker
                            key={data?.id}
                            position={[parseFloat(data?.latitud), parseFloat(data?.longitud)]}
                        ></Marker>
                    </MapContainer>
                </div>

                {/* Fotos preview */}
                <div className="grid grid-cols-1 gap-y-4 text-sm text-gray-700">
                    <div className="sm:col-span-2">
                        <span className="block font-semibold text-gray-900 mb-2">Fotos:</span>
                        {data?.fotos?.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {data.fotos.map((foto, index) => (
                                    <Zoom
                                        key={`Foto-${index + 1}`}
                                    >
                                        <div
                                            className="w-24 h-24 rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-300 cursor-pointer"
                                        >
                                            <img
                                                src={`${import.meta.env.VITE_APP_ENDPOINT_PRUEBA}/${foto}`}
                                                alt={`Foto-${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </Zoom>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No hay fotos disponibles.</p>
                        )}
                    </div>
                </div>
            </div>
        </CustomModal>
    )
}

export default DetalleIncidencia