import { useQuery } from '@tanstack/react-query';
import { incidenceApi } from '../../utils/axiosConfig';

const useTiposCasos = () => {
    const fetchTiposCasos = async ({ signal }) => {
        const response = await incidenceApi.get(
            'tipificaciones/tipo_casos',
            { signal }
        );

        return response.data?.data || [];
    };

    const query = useQuery({
        queryKey: ['tiposCasos'],
        queryFn: fetchTiposCasos,
        staleTime: 7 * 24 * 60 * 60 * 1000, // 7 días
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 días
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