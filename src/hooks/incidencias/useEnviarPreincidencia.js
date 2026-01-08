import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { incidenceApi } from '../../utils/axiosConfig';
import { handleTokenExpired } from '../../redux/slices/AuthSlice';

const useEnviarPreincidencia = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);

    const enviarPreincidencia = async (datosFormulario, userData, jurisdiccionId) => {
        setLoading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Validación de token
            if (!token) {
                console.warn('No hay token de autenticación disponible');
                dispatch(handleTokenExpired());
                navigate('/verificacion', { replace: true });
                throw new Error('No hay token de autenticación');
            }

            // Crear FormData
            const formData = new FormData();

            // Datos fijos
            formData.append('unidad_id', 1);
            formData.append('medio_id', 1);

            // Datos del usuario
            if (userData) {
                formData.append('cargo_sereno_id', Number(userData.cargo_sereno_id));
                formData.append('sereno_id', Number(userData.id_sereno));
                formData.append('nombre_reportante', `${userData.nombres || ''} ${userData.apellidos || ''}`.trim());
                formData.append('turno', userData.turno || 'MANANA');
                // Agregar teléfono del reportante usando el celular del usuario
                formData.append('telefono_reportante', userData.celular || '');
            }

            // Datos del formulario
            formData.append('tipo_caso_id', Number(datosFormulario.tipo));
            formData.append('sub_tipo_caso_id', Number(datosFormulario.subtipo));
            formData.append('direccion', datosFormulario.direccion);
            formData.append('descripcion', datosFormulario.descripcion);

            // Coordenadas (si están disponibles)
            if (datosFormulario.latitud && datosFormulario.longitud) {
                formData.append('latitud', datosFormulario.latitud.toString());
                formData.append('longitud', datosFormulario.longitud.toString());
            }

            // Jurisdicción
            if (jurisdiccionId) {
                formData.append('jurisdiccion_id', jurisdiccionId);
            }

            // Fecha y hora
            if (datosFormulario.fechaIncidente) {
                formData.append('fecha_ocurrencia', datosFormulario.fechaIncidente.format('YYYY-MM-DD'));
            }

            if (datosFormulario.horaIncidente) {
                formData.append('hora_ocurrencia', datosFormulario.horaIncidente.format('HH:mm:ss'));
            }

            // Tipo reportante (valor por defecto)
            formData.append('tipo_reportante_id', 2);

            // Fotos - Validación y envío
            if (datosFormulario.fotos && datosFormulario.fotos.length > 0) {
                datosFormulario.fotos.forEach((foto, index) => {
                    if (foto.file && foto.file instanceof File) {
                        try {
                            formData.append('fotos', foto.file, foto.name);
                        } catch (error) {
                            console.error(`Error al agregar archivo ${index} al FormData:`, error);
                            throw new Error(`Error al procesar el archivo ${foto.name}: ${error.message}`);
                        }
                    } else {
                        console.error(`Archivo ${index} no es válido:`, foto);
                        throw new Error(`El archivo ${foto.name} no es válido para envío`);
                    }
                });
            }

            const { data: result } = await incidenceApi.post(
                '/api/incidencias/',
                formData,
                {
                    // Progreso real de upload (no simulado)
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            // Invalidar cache de preincidencias después del envío exitoso
            await queryClient.invalidateQueries({
                queryKey: ['preincidencias'],
            });

            return result;

        } catch (err) {
            // Solo log de errores críticos en desarrollo
            if (import.meta.env.DEV) {
                console.error('Error enviando preincidencia:', err);
            }

            // Manejo específico de errores de timeout
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                setError('Tiempo de envío superado, por favor verifique su conexión a internet.');
            } else if (err.response) {
                const { status, data } = err.response;

                if (status === 400) {
                    setError(`Error de validación: ${data?.message || 'Datos del formulario incorrectos'}`);
                } else if (status === 401) {
                    dispatch(handleTokenExpired());
                    navigate('/verificacion', { replace: true });
                    setError('Sesión expirada. Redirigiendo al login...');
                } else if (status >= 500) {
                    setError('Error del servidor. Por favor, intente más tarde.');
                } else {
                    setError(`Error ${status}: ${data?.message || err.message}`);
                }
            } else if (err.request) {
                setError('Error de conexión 📡. Verifique su conexión a internet.');
            } else {
                setError(err.message || 'Error desconocido');
            }

            throw err;
        } finally {
            setLoading(false);
            // Resetear progreso después de completar (éxito o error)
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    return { enviarPreincidencia, loading, error, uploadProgress };
};

export default useEnviarPreincidencia;