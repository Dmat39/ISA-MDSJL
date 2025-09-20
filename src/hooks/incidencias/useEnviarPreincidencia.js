import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { incidenceApi } from '../../utils/axiosConfig';
import { handleTokenExpired } from '../../redux/slices/AuthSlice';

const useEnviarPreincidencia = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);

    const enviarPreincidencia = async (datosFormulario, userData, jurisdiccionId) => {
        setLoading(true);
        setError(null);

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
            formData.append('unidad_id', '1');
            formData.append('medio_id', '3');

            // Datos del usuario
            if (userData) {
                formData.append('cargo_sereno_id', userData.cargo_sereno_id || '');
                formData.append('sereno_id', userData.id_sereno || '');
                formData.append('nombre_reportante', `${userData.nombres || ''} ${userData.apellidos || ''}`.trim());
                formData.append('turno', userData.turno || 'Mañana');
                // Agregar teléfono del reportante usando el celular del usuario
                formData.append('telefono_reportante', userData.celular || '');
            }

            // Datos del formulario
            formData.append('tipo_caso_id', datosFormulario.tipo);
            formData.append('sub_tipo_caso_id', datosFormulario.subtipo);
            formData.append('direccion', datosFormulario.direccion);
            formData.append('descripcion', datosFormulario.descripcion);

            // Coordenadas (si están disponibles)
            if (datosFormulario.latitud && datosFormulario.longitud) {
                formData.append('latitud', datosFormulario.latitud.toString());
                formData.append('longitud', datosFormulario.longitud.toString());
            }

            // Jurisdicción
            if (jurisdiccionId) {
                formData.append('jurisdiccion_id', jurisdiccionId.toString());
            }

            // Fecha y hora
            if (datosFormulario.fechaIncidente) {
                formData.append('fecha_ocurrencia', datosFormulario.fechaIncidente.format('YYYY-MM-DD'));
            }

            if (datosFormulario.horaIncidente) {
                formData.append('hora_ocurrencia', datosFormulario.horaIncidente.format('HH:mm:ss'));
            }

            // Tipo reportante (valor por defecto)
            formData.append('tipo_reportante_id', '2');

            // Fotos - Validación y envío
            if (datosFormulario.fotos && datosFormulario.fotos.length > 0) {
                console.log(`Enviando ${datosFormulario.fotos.length} archivo(s)`);

                datosFormulario.fotos.forEach((foto, index) => {
                    if (foto.file && foto.file instanceof File) {
                        console.log(`Agregando archivo ${index}: ${foto.name}, tipo: ${foto.type}, tamaño: ${foto.file.size} bytes`);

                        try {
                            // Opción 1: Sin corchetes (funciona mejor en la mayoría de servidores)
                            formData.append('fotos', foto.file, foto.name);

                            // Log adicional para debugging
                            console.log(`Archivo ${index} agregado exitosamente al FormData`);
                        } catch (error) {
                            console.error(`Error al agregar archivo ${index} al FormData:`, error);
                            throw new Error(`Error al procesar el archivo ${foto.name}: ${error.message}`);
                        }
                    } else {
                        console.error(`Archivo ${index} no es válido:`, foto);
                        throw new Error(`El archivo ${foto.name} no es válido para envío`);
                    }
                });
            } else {
                console.warn('No hay archivos para enviar');
                
            }

            // Verificación final del FormData
            console.log('Enviando FormData:');
            let tieneArchivos = false;
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
                if (key === 'fotos' && value instanceof File) {
                    tieneArchivos = true;
                }
            }

            console.log('FormData contiene archivos:', tieneArchivos);

            // Verificación adicional
            if (datosFormulario.fotos && datosFormulario.fotos.length > 0 && !tieneArchivos) {
                console.error('ADVERTENCIA: Se esperaban archivos pero no se encontraron en FormData');
            }

            const { data: result } = await incidenceApi.post(
                '/api/preincidencias/',
                formData
            );

            // Invalidar cache de preincidencias después del envío exitoso
            console.log('✅ Incidencia enviada exitosamente, invalidando cache...');
            await queryClient.invalidateQueries({
                queryKey: ['preincidencias'],
            });

            return result;

        } catch (err) {
            console.error('Error enviando preincidencia:', err);

            // Manejo específico de errores de timeout
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                setError('Tiempo de envío superado, por favor verifique su conexión a internet.');
            } else if (err.response) {
                const { status, data } = err.response;
                console.error('Detalles del error:', { status, data });

                if (status === 400) {
                    setError(`Error de validación: ${data?.message || 'Datos del formulario incorrectos'}`);
                } else if (status === 401) {
                    console.warn('Token expirado durante envío de preincidencia');
                    dispatch(handleTokenExpired());
                    navigate('/verificacion', { replace: true });
                    setError('Sesión expirada. Redirigiendo al login...');
                } else if (status >= 500) {
                    setError('Error del servidor. Por favor, intente más tarde.');
                } else {
                    setError(`Error ${status}: ${data?.message || err.message}`);
                }
            } else if (err.request) {
                console.error('Error de red:', err.request);
                setError('Error de conexión 📡. Verifique su conexión a internet.');
            } else {
                setError(err.message || 'Error desconocido');
            }

            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { enviarPreincidencia, loading, error };
};

export default useEnviarPreincidencia;