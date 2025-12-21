import { useQuery } from '@tanstack/react-query';
import { incidenceApi } from '../../utils/axiosConfig';
import { useSelector } from 'react-redux';

const UseIncidencias = ({ inicio, fin, estado }) => {
    const { user } = useSelector((state) => state.auth);

    const listaIncidencias = async ({ signal }) => {
        if (!user) {
            throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
        }

        if (!user.id_sereno) {
            throw new Error('ID del sereno no encontrado.');
        }
        
        // Construir ruta relativa para que `baseURL` y el interceptor con token funcionen
        const endpointPath = `/api/incidencias/sereno/${user.id_sereno}`;

        const response = await incidenceApi.get(endpointPath, {
            signal,
            params: {
                ...(inicio ? { fecha_inicio: inicio } : {}),
                ...(fin ? { fecha_fin: fin } : {}),
                ...(estado ? { estado } : {}),
            },
        })

        return response.data
    }


    const query = useQuery({
        queryKey: ['preincidencias', user?.id_sereno, inicio, fin, estado],
        queryFn: listaIncidencias,
        enabled: !!user?.id_sereno, // Solo ejecutar si el usuario tiene id_sereno
        staleTime: 7 * 24 * 60 * 60 * 1000, // 7 días (1 semana)
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 días (mantener en cache)
        refetchOnWindowFocus: false,
        retry: 1
    })

    return query
}

export default UseIncidencias