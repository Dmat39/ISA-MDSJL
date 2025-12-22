import { useQuery } from '@tanstack/react-query';
import { incidenceApi } from '../../utils/axiosConfig';

const useTiposCasos = () => {
    const fetchTiposCasos = async ({ signal }) => {
        const response = await incidenceApi.get(
            '/api/tipificaciones/tipo_casos',
            { signal }
        );

        return response.data?.data || [];
    };

    const query = useQuery({
        queryKey: ['tiposCasos'],
        queryFn: fetchTiposCasos,
        staleTime: 60 * 60 * 1000, // 1 hora (tipos de casos cambian poco, pero no 7 días)
        gcTime: 2 * 60 * 60 * 1000, // 2 horas (mantener en cache)
        refetchOnWindowFocus: false,
        retry: 1,
        onError: (error) => {
            console.error('Error en useTiposCasos:', error);
        }
    });

    return {
        tiposCasos: query.data || [],
        loading: query.isLoading,
        error: query.error?.message || null,
        refetch: query.refetch
    };
};

export default useTiposCasos;