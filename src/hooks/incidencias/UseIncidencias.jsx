import { useQuery } from '@tanstack/react-query';
import { incidenceApi } from '../../utils/axiosConfig';
import { useSelector } from 'react-redux';

const UseIncidencias = ({ inicio, fin, estado }) => {
    const { user } = useSelector((state) => state.auth);

    const listaIncidencias = async ({ signal }) => {
        
        // Debug logging completo
        console.log('=== DIAGNÓSTICO UseIncidencias ===');
        console.log('Usuario completo:', user);
        console.log('ID Sereno:', user?.id_sereno);
        console.log('Propiedades del usuario:', user ? Object.keys(user) : 'No hay usuario');
        console.log('Endpoint base:', import.meta.env.VITE_APP_ENDPOINT_PRUEBA);
        console.log('Parámetros de búsqueda:', { inicio, fin, estado });
        console.log('================================');
        
        if (!user) {
            throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
        }
        
        if (!user.id_sereno) {
            console.error('Estructura del usuario:', user);
            throw new Error(`ID del sereno no encontrado. Usuario actual: ${JSON.stringify(user, null, 2)}`);
        }
        
        // Construir ruta relativa para que `baseURL` y el interceptor con token funcionen
        const endpointPath = `preincidencias/sereno/${user.id_sereno}`;

        const response = await incidenceApi.get(endpointPath, {
            signal,
            params: {
                ...(inicio ? { fecha_inicio: inicio } : {}),
                ...(fin ? { fecha_fin: fin } : {}),
                ...(estado ? { estado } : {}),
            },
        })
        
        console.log('Respuesta recibida:', response.data);
        return response.data
    }


    const query = useQuery({
        queryKey: ['preincidencias', user?.id_sereno, inicio, fin, estado],
        queryFn: listaIncidencias,
        enabled: !!user?.id_sereno, // Solo ejecutar si el usuario tiene id_sereno
        staleTime: 7 * 24 * 60 * 60 * 1000, // 7 días (1 semana)
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 días (mantener en cache)
        refetchOnWindowFocus: false,
        retry: 1,
        onError: (error) => {
            console.error('Error en UseIncidencias:', error);
        }
    })

    return query
}

export default UseIncidencias