import { Button } from "@mui/material";
import { AlertCircle, CalendarDays, CheckCircle, Clock, Eye, Plus, XCircle } from "lucide-react";
import { dayjsConZona } from "../../utils/dayjsConfig";
import { useState } from "react";
import DetalleIncidenciaModal from "../../Components/General/DetalleIncidenciaModal";


const ListaIncidencias = ({ data, inicio, fin, estado, isFetching }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);

    const getEstadoBadge = (estado) => {
        switch (estado) {
            case "APROBADO":
                return {
                    className: "bg-green-100 text-green-800 hover:bg-green-100",
                    icon: <CheckCircle className="w-3 h-3" />,
                }
            case "RECHAZADO":
                return {
                    className: "bg-red-100 text-red-800 hover:bg-red-100",
                    icon: <XCircle className="w-3 h-3" />,
                }
            case "PENDIENTE":
                return {
                    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                    icon: <AlertCircle className="w-3 h-3" />,
                }
            default:
                return {
                    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
                    icon: <AlertCircle className="w-3 h-3" />,
                }
        }
    }

    const handleVerDetalle = (incidencia) => {
        setIncidenciaSeleccionada(incidencia);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setIncidenciaSeleccionada(null);
    };

    return (
        <div className="space-y-4">
            {data?.length === 0 ? (
                <div className="w-full rounded-lg border border-gray-200 bg-white shadow-xs">
                    <div className="p-8 text-center">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900">No se encontraron incidencias</h3>
                            </div>
                            <p className="text-sm text-gray-600 max-w-sm">
                                No hay incidencias registradas
                                {inicio && fin && inicio === fin && <> el <span className="font-medium text-nowrap">{dayjsConZona(inicio).format('DD-MM-YYYY')}</span></>}
                                {inicio && fin && inicio !== fin && <> entre el <span className="font-medium  text-nowrap">{inicio}</span> y el <span className="font-medium  text-nowrap">{fin}</span></>}
                                {inicio && !fin && <> desde el <span className="font-medium text-nowrap">{inicio}</span></>}
                                {!inicio && fin && <> hasta el <span className="font-medium text-nowrap">{fin}</span></>}
                                {estado && <> con estado <span className="font-medium capitalize text-nowrap"> {estado}</span></>}
                                {!inicio && !fin && estado === "todos" && <> registradas en el sistema.</>}
                            </p>
                        </div>
                    </div>
                </div>
            ) : <>
                {data?.map((incidencia) => {
                    const date = dayjsConZona(incidencia.fecha_ocurrencia + 'T' + incidencia.hora_ocurrencia);
                    return (
                        <div key={incidencia.id} className="w-full rounded-lg border border-gray-200 bg-white shadow-xs">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <CalendarDays className="w-4 h-4" />
                                            <span>{date.format('DD-MM-YYYY')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{date.format('HH:mm')}</span>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getEstadoBadge(incidencia.estado).className}`}>
                                        {getEstadoBadge(incidencia.estado).icon}
                                        <span className="capitalize">{incidencia.estado.toLowerCase()}</span>
                                    </div>
                                </div>

                                {incidencia.estado === "APROBADO" && incidencia.codigo_incidencia && (
                                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                                        <p className="text-sm text-green-700 font-medium">Código: {incidencia.codigo_incidencia}</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleVerDetalle(incidencia)}
                                    className="w-full flex items-center justify-center font-medium gap-2 px-4 py-2 border border-gray-300 text-sm rounded-md text-gray-900 hover:bg-gray-100 cursor-pointer transition"
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver Detalle
                                </button>
                            </div>
                        </div>
                    )
                })}
            </>}

            {/* Modal de Detalle */}
            <DetalleIncidenciaModal
                open={modalOpen}
                onClose={handleCloseModal}
                incidencia={incidenciaSeleccionada}
            />
        </div>
    );
};


export default ListaIncidencias