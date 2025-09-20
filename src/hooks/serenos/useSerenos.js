import { useState, useEffect } from 'react';
import { incidenceApi } from '../../utils/axiosConfig';

const useSerenos = ({ searchTerm, fecha, turno, jurisdiccion, page = 1, limit = 20 }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [error, setError] = useState(null);

    const fetchSerenos = async () => {
        setLoading(true);
        setError(null);

        try {
            // Construir parámetros de consulta - solo incluir parámetros con valores válidos
            const params = {
                page,
                limit
            };

            // Agregar parámetros requeridos y opcionales
            if (fecha && fecha.trim()) {
                params.date = fecha;
            }

            // Turno es requerido - usar valor por defecto si no está definido
            const validTurno = turno && ['mañana', 'tarde', 'noche'].includes(turno.toLowerCase())
                ? turno.toLowerCase()
                : 'mañana';
            params.turno = validTurno;

            // jurisdiccionId es requerido - usar valor por defecto si no está definido
            const validJurisdiccion = jurisdiccion && !isNaN(jurisdiccion) && jurisdiccion > 0
                ? Number(jurisdiccion)
                : 2; // Zárate por defecto
            params.jurisdiccionId = validJurisdiccion;

            if (searchTerm && searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            // Debug: mostrar parámetros que se enviarán
            console.log('Parámetros enviados al endpoint:', params);

            // Llamada a la API del endpoint /api/historial/titan
            const response = await incidenceApi.get('/api/historial/titan', { params });

            // Procesar los datos de la respuesta
            const historialData = response.data.historial || [];

            // Transformar los datos para que coincidan con la estructura esperada
            const transformedData = historialData.map(item => ({
                sereno_id: item.sereno_id,
                nombres_completos: item.nombre_reportante,
                codigos: item.codigo_incidencias || [],
                cuenta: item.codigo_incidencias ? item.codigo_incidencias.length : 0
            }));

            setData(transformedData);
            setCount(response.data.totalCount || 0);

        } catch (err) {
            console.error('Error fetching serenos:', err);

            // Manejar diferentes tipos de errores
            let errorMessage = 'Error al cargar los datos de serenos';

            if (err.response?.status === 400) {
                errorMessage = 'Parámetros de búsqueda inválidos. Verifique los filtros seleccionados.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Endpoint no encontrado. Contacte al administrador.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setData([]);
            setCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSerenos();
    }, [searchTerm, fecha, turno, jurisdiccion, page, limit]);

    return {
        data,
        loading,
        count,
        error,
        refetch: fetchSerenos
    };
};

export default useSerenos;