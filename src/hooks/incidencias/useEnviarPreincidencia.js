import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { incidenceApi } from '../../utils/axiosConfig';

const useEnviarPreincidencia = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const queryClient = useQueryClient();
    // const { token } = useSelector((state) => state.auth); // Comentado temporalmente

    const enviarPreincidencia = async (datosFormulario, userData, jurisdiccionId) => {
        setLoading(true);
        setError(null);

        try {
            // Validación de token comentada temporalmente
            // if (!token) {
            //     throw new Error('No hay token de autenticación');
            // }

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
                console.log(`Enviando ${datosFormulario.fotos.length} foto(s)`);
                
                datosFormulario.fotos.forEach((foto, index) => {
                    if (foto.file && foto.file instanceof File) {
                        console.log(`Agregando foto ${index}: ${foto.name}, tamaño: ${foto.file.size} bytes`);
                        
                        // Opción 1: Sin corchetes
                        formData.append('fotos', foto.file, foto.name);
                        
                        // Opción 2: Con corchetes (descomenta si la opción 1 no funciona)
                        // formData.append('fotos[]', foto.file, foto.name);
                        
                        // Opción 3: Con índice (descomenta si las anteriores no funcionan)
                        // formData.append(`fotos[${index}]`, foto.file, foto.name);
                    } else {
                        console.error(`Foto ${index} no es válida:`, foto);
                    }
                });
            } else {
                console.warn('No hay fotos para enviar');
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
                'preincidencias/',
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
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { enviarPreincidencia, loading, error };
};

export default useEnviarPreincidencia;