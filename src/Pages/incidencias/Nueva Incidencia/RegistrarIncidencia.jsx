import React, { useState, useEffect } from 'react';
import { Button, FormControl, MenuItem, Select, TextField, CircularProgress, Alert, Snackbar, LinearProgress } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { MapPin, Plus, Loader, Navigation } from 'lucide-react';
import { dayjsConZona } from '../../../utils/dayjsConfig';
import useTiposCasos from '../../../hooks/incidencias/useTiposCasos';
import useGeolocation from '../../../hooks/incidencias/useGeolocation';
import useJurisdiccionDetection from '../../../hooks/incidencias/useJurisdiccionDetection';
import useUserData from '../../../hooks/auth/useUserData';
import useEnviarPreincidencia from '../../../hooks/incidencias/useEnviarPreincidencia';
import MapModal from '../../../Components/General/MapModal';
import ModalSubirFotos from './ModalSubirFotos';
import { useNavigate } from 'react-router';

const RegistrarIncidencia = () => {
    const { tiposCasos, loading: loadingTipos, error: errorTipos } = useTiposCasos();
    const { latitude, longitude, address, loading: loadingLocation, error: errorLocation, permissionStatus, requestPermission } = useGeolocation();
    const { obtenerJurisdiccionActual, detectarJurisdiccion, jurisdicciones, loading: loadingJurisdiccion, error: errorJurisdiccion } = useJurisdiccionDetection();
    const { userData, loading: loadingUser, error: errorUser } = useUserData();
    const { enviarPreincidencia, loading: loadingEnvio, error: errorEnvio } = useEnviarPreincidencia();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        tipo: '',
        subtipo: '',
        fechaIncidente: dayjsConZona(),
        horaIncidente: dayjsConZona(),
        direccion: '',
        jurisdiccion: '',
        descripcion: '',
        fotos: []
    });

    // Estado para manejar coordenadas dinámicas
    const [coordenadasSeleccionadas, setCoordenadasSeleccionadas] = useState({
        latitud: null,
        longitud: null
    });

    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [jurisdiccionDetectada, setJurisdiccionDetectada] = useState(null);
    const [fotosModalOpen, setFotosModalOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [descripcionError, setDescripcionError] = useState('');
    const [progress, setProgress] = useState(0);

    // Obtener subtipos basados en el tipo seleccionado
    const getSubtipos = () => {
        const tipoSeleccionado = tiposCasos.find(tipo => tipo.id === formData.tipo);
        return tipoSeleccionado?.subtipos || [];
    };

    // Actualizar dirección cuando se obtenga la ubicación inicial
    useEffect(() => {
        console.log('=== SINCRONIZACIÓN DE DIRECCIÓN INICIAL ===');
        console.log('Address desde hook:', address);
        console.log('Coordenadas iniciales:', { latitude, longitude });

        if (address && latitude && longitude) {
            console.log('Actualizando dirección y coordenadas iniciales:', address);
            setFormData(prev => ({
                ...prev,
                direccion: address
            }));

            // Establecer coordenadas iniciales
            setCoordenadasSeleccionadas({
                latitud: latitude,
                longitud: longitude
            });
        }
    }, [address, latitude, longitude]);

    // Actualizar jurisdicción cuando se detecte automáticamente
    useEffect(() => {
        if (jurisdiccionDetectada && !formData.jurisdiccion) {
            setFormData(prev => ({
                ...prev,
                jurisdiccion: jurisdiccionDetectada.name
            }));
        }
    }, [jurisdiccionDetectada, formData.jurisdiccion]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Validación específica para descripción
        if (field === 'descripcion') {
            if (value.length < 10 && value.length > 0) {
                setDescripcionError('Introduzca correctamente la descripción');
            } else {
                setDescripcionError('');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Iniciar progreso
        setProgress(0);
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        // Limpiar el intervalo al finalizar (éxito o error)
        const cleanupProgress = () => {
            clearInterval(progressInterval);
        };

        // Validaciones básicas
        if (!formData.tipo || !formData.subtipo) {
            setSnackbar({
                open: true,
                message: 'Por favor selecciona tipo y subtipo de incidencia',
                severity: 'error'
            });
            return;
        }

        if (!formData.descripcion.trim()) {
            setSnackbar({
                open: true,
                message: 'Por favor ingresa una descripción',
                severity: 'error'
            });
            return;
        }

        if (formData.descripcion.trim().length < 10) {
            setSnackbar({
                open: true,
                message: 'La descripción debe de ser más detallada',
                severity: 'error'
            });
            return;
        }

        // Validar que tengamos coordenadas
        if (!coordenadasSeleccionadas.latitud || !coordenadasSeleccionadas.longitud) {
            setSnackbar({
                open: true,
                message: 'No se pudo obtener la ubicación. Por favor, verifica los permisos de ubicación.',
                severity: 'error'
            });
            return;
        }

        // Validar que la fecha y hora no sean futuras
        if (formData.fechaIncidente && formData.horaIncidente) {
            const fechaHoraIncidente = formData.fechaIncidente
                .hour(formData.horaIncidente.hour())
                .minute(formData.horaIncidente.minute());
            const ahora = dayjsConZona();

            if (fechaHoraIncidente.isAfter(ahora)) {
                setSnackbar({
                    open: true,
                    message: 'La fecha y hora del incidente no puede ser futura. Por favor, corrige los datos.',
                    severity: 'error'
                });
                return;
            }
        }

        try {
            // Obtener jurisdiccion_id
            let jurisdiccionId = null;
            if (jurisdiccionDetectada) {
                jurisdiccionId = jurisdiccionDetectada.id;
            } else if (formData.jurisdiccion) {
                // Buscar jurisdicción por nombre
                const jurisdiccionEncontrada = jurisdicciones.find(j =>
                    j.name.toLowerCase() === formData.jurisdiccion.toLowerCase()
                );
                if (jurisdiccionEncontrada) {
                    jurisdiccionId = jurisdiccionEncontrada.id;
                }
            }

            // Preparar datos para envío con coordenadas dinámicas
            const datosEnvio = {
                ...formData,
                latitud: coordenadasSeleccionadas.latitud,
                longitud: coordenadasSeleccionadas.longitud
            };

            console.log('Enviando datos con coordenadas:', datosEnvio);
            console.log('Coordenadas seleccionadas:', coordenadasSeleccionadas);
            console.log('Usuario:', userData);
            console.log('Jurisdicción ID:', jurisdiccionId);

            const resultado = await enviarPreincidencia(datosEnvio, userData, jurisdiccionId);

            // Limpiar el intervalo de progreso
            cleanupProgress();

            // Completar progreso al 100%
            setProgress(100);
            
            // Esperar un momento para mostrar el progreso completo
            setTimeout(() => {
                setProgress(0);
            }, 1000);

            setSnackbar({
                open: true,
                message: 'Incidencia registrada exitosamente',
                severity: 'success'
            });

            // Limpiar formulario después del éxito
            setFormData({
                tipo: '',
                subtipo: '',
                fechaIncidente: dayjsConZona(),
                horaIncidente: dayjsConZona(),
                direccion: '',
                jurisdiccion: '',
                descripcion: '',
                fotos: []
            });
            setJurisdiccionDetectada(null);
            setCoordenadasSeleccionadas({ latitud: null, longitud: null });

            console.log('Resultado:', resultado);

            // Redirigir a la lista
            navigate('/', { replace: true });

        } catch (error) {
            console.error('Error al enviar incidencia:', error);
            
            // Limpiar el intervalo de progreso
            cleanupProgress();
            
            // Resetear progreso en caso de error
            setProgress(0);
            
            // Manejo específico de errores de timeout
            let errorMessage = 'Error al registrar la incidencia';
            
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = 'Tiempo de envío superado, por favor verifique su conexión a internet.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
    };

    const handleAgregarFoto = () => {
        setFotosModalOpen(true);
    };

    const handleCloseFotosModal = () => {
        setFotosModalOpen(false);
    };

    const handleFotosChange = (nuevasFotos) => {
        setFormData(prev => ({
            ...prev,
            fotos: nuevasFotos
        }));
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleOpenMap = () => {
        setMapModalOpen(true);
    };

    const handleCloseMap = () => {
        setMapModalOpen(false);
    };

    // Manejar selección de nueva ubicación desde el mapa
    const handleLocationSelect = async (newLocation) => {
        console.log('=== NUEVA UBICACIÓN SELECCIONADA DESDE MAPA ===');
        console.log('Nueva ubicación recibida:', newLocation);
        console.log('Jurisdicciones disponibles:', jurisdicciones?.length || 0);
        console.log('Función detectarJurisdiccion disponible:', !!detectarJurisdiccion);

        // Actualizar dirección en el formulario
        setFormData(prev => ({
            ...prev,
            direccion: newLocation.address
        }));

        // Actualizar coordenadas seleccionadas con las nuevas coordenadas del mapa
        setCoordenadasSeleccionadas({
            latitud: newLocation.latitude,
            longitud: newLocation.longitude
        });

        console.log('Coordenadas actualizadas desde mapa:', {
            latitud: newLocation.latitude,
            longitud: newLocation.longitude
        });

        // Detectar jurisdicción usando las coordenadas específicas del mapa
        if (jurisdicciones && jurisdicciones.length > 0 && detectarJurisdiccion) {
            try {
                console.log('🔍 Iniciando detección de jurisdicción...');
                console.log('Coordenadas para detectar:', newLocation.latitude, newLocation.longitude);

                // Usar la función detectarJurisdiccion que ya está disponible
                const jurisdiccionEncontrada = detectarJurisdiccion(newLocation.latitude, newLocation.longitude);

                if (jurisdiccionEncontrada) {
                    /* console.log('✅ Nueva jurisdicción detectada:', jurisdiccionEncontrada); */
                    setJurisdiccionDetectada(jurisdiccionEncontrada);

                    setFormData(prev => ({
                        ...prev,
                        jurisdiccion: jurisdiccionEncontrada.name
                    }));

                    console.log('✅ Jurisdicción actualizada en formulario:', jurisdiccionEncontrada.name);
                } else {
                    console.warn('❌ No se encontró jurisdicción para las coordenadas seleccionadas');
                    // Limpiar jurisdicción si no se encuentra
                    setJurisdiccionDetectada(null);
                    setFormData(prev => ({
                        ...prev,
                        jurisdiccion: ''
                    }));
                    console.log('🧹 Jurisdicción limpiada del formulario');
                }
            } catch (err) {
                console.error('💥 Error detectando jurisdicción para nueva ubicación:', err);
                setJurisdiccionDetectada(null);
                setFormData(prev => ({
                    ...prev,
                    jurisdiccion: ''
                }));
            }
        } else {
            console.warn('⚠️ Condiciones no cumplidas para detectar jurisdicción:');
            console.warn('- Jurisdicciones cargadas:', !!jurisdicciones && jurisdicciones.length > 0);
            console.warn('- Función detectarJurisdiccion disponible:', !!detectarJurisdiccion);
        }

        // Cerrar el modal del mapa después de seleccionar ubicación
        setMapModalOpen(false);
    };

    // Función para detectar jurisdicción automáticamente
    const handleDetectarJurisdiccion = async () => {
        try {
            const resultado = await obtenerJurisdiccionActual();

            if (resultado.jurisdiccion) {
                setJurisdiccionDetectada(resultado.jurisdiccion);
                setFormData(prev => ({
                    ...prev,
                    jurisdiccion: resultado.jurisdiccion.name
                }));
            } else {
                // Si no se encuentra jurisdicción, mostrar alerta
                alert('No se pudo determinar la jurisdicción para su ubicación actual. Por favor, ingrese manualmente.');
            }
        } catch (error) {
            console.error('Error detectando jurisdicción:', error);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 bg-whites">
            <h1 className="text-xl font-bold text-gray-900 mt-4 mb-7 text-center">
                REGISTRAR INCIDENCIA
            </h1>

            {/* Alertas de error */}
            {/*  {errorUser && (
                <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
                    Error cargando datos del usuario: {errorUser}
                </Alert>
            )} */}


            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipos */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipos
                    </label>
                    <FormControl fullWidth size="small">
                        <Select
                            value={formData.tipo}
                            onChange={(e) => {
                                handleInputChange('tipo', e.target.value);
                                handleInputChange('subtipo', ''); // Reset subtipo
                            }}
                            displayEmpty
                            className="bg-gray-50"
                            disabled={loadingTipos}
                            sx={{ fontSize: '0.7855rem' }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 300,
                                        '& .MuiMenuItem-root': {
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '400px',
                                            '&:hover': {
                                                whiteSpace: 'normal',
                                                overflow: 'visible',
                                                textOverflow: 'unset',
                                                wordBreak: 'break-word',
                                                minHeight: 'auto',
                                                height: 'auto',
                                                padding: '8px 16px'
                                            }
                                        }
                                    }
                                }
                            }}
                        >
                            <MenuItem value="" disabled sx={{ fontSize: '0.875rem' }}>
                                {loadingTipos ? (
                                    <div className="flex items-center gap-2">
                                        <CircularProgress size={14} />
                                        <span className="text-sm">Cargando...</span>
                                    </div>
                                ) : (
                                    'Selecciona una opción'
                                )}
                            </MenuItem>
                            {!loadingTipos && tiposCasos.map((tipo) => (
                                <MenuItem
                                    key={tipo.id}
                                    value={tipo.id}
                                    sx={{
                                        fontSize: '0.775rem',
                                        marginTop: '-5px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '400px',
                                        '&:hover': {
                                            whiteSpace: 'normal',
                                            overflow: 'visible',
                                            textOverflow: 'unset',
                                            wordBreak: 'break-word',
                                            minHeight: 'auto',
                                            height: 'auto'
                                        }
                                    }}
                                    title={tipo.descripcion}
                                >
                                    {tipo.descripcion}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {errorTipos && (
                        <p className="text-red-500 text-xs mt-1">
                            Error al cargar tipos: {errorTipos}
                        </p>
                    )}
                </div>

                {/* SubTipos */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        SubTipos
                    </label>
                    <FormControl fullWidth size="small">
                        <Select
                            value={formData.subtipo}
                            onChange={(e) => handleInputChange('subtipo', e.target.value)}
                            displayEmpty
                            disabled={!formData.tipo || loadingTipos}
                            className="bg-gray-50"
                            sx={{ fontSize: '0.775rem' }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 300,
                                        '& .MuiMenuItem-root': {
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '400px',
                                            '&:hover': {
                                                whiteSpace: 'normal',
                                                overflow: 'visible',
                                                textOverflow: 'unset',
                                                wordBreak: 'break-word',
                                                minHeight: 'auto',
                                                height: 'auto',
                                                padding: '8px 16px'
                                            }
                                        }
                                    }
                                }
                            }}
                        >
                            <MenuItem value="" disabled sx={{ fontSize: '0.875rem' }}>
                                {!formData.tipo ? 'Primero selecciona un tipo' : 'Selecciona una opción'}
                            </MenuItem>
                            {formData.tipo && getSubtipos().map((subtipo) => (
                                <MenuItem
                                    key={subtipo.id}
                                    value={subtipo.id}
                                    sx={{
                                        fontSize: '0.75rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '400px',
                                        '&:hover': {
                                            whiteSpace: 'normal',
                                            overflow: 'visible',
                                            textOverflow: 'unset',
                                            wordBreak: 'break-word',
                                            minHeight: 'auto',
                                            height: 'auto'
                                        }
                                    }}
                                    title={subtipo.descripcion}
                                >
                                    {subtipo.descripcion}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>

                {/* Fecha y Hora del Incidente */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Fecha del Incidente
                        </label>
                        <DatePicker
                            value={formData.fechaIncidente}
                            onChange={(date) => {
                                handleInputChange('fechaIncidente', date);
                                
                                // Si selecciona fecha de hoy, verificar que la hora no sea futura
                                if (date && formData.horaIncidente) {
                                    const hoy = dayjsConZona();
                                    const fechaEsHoy = date.isSame(hoy, 'day');
                                    
                                    if (fechaEsHoy) {
                                        const horaCompleta = date.hour(formData.horaIncidente.hour()).minute(formData.horaIncidente.minute());
                                        
                                        if (horaCompleta.isAfter(hoy)) {
                                            // Ajustar la hora a la actual si es futura
                                            handleInputChange('horaIncidente', hoy);
                                            setSnackbar({
                                                open: true,
                                                message: 'Se ajustó la hora porque no puede ser futura para la fecha de hoy.',
                                                severity: 'info'
                                            });
                                        }
                                    }
                                }
                            }}
                            format="DD/MM/YYYY"
                            maxDate={dayjsConZona()} // Solo permite hasta hoy
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    fullWidth: true,
                                    className: 'bg-gray-50',
                                    sx: { '& .MuiInputBase-input': { fontSize: '0.775rem' } },
                                    /* helperText: 'Solo fechas pasadas y presente', */
                                    inputProps: {
                                        placeholder: 'DD/MM/YYYY'
                                    }
                                }
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Hora del Incidente
                        </label>
                        <TimePicker
                            value={formData.horaIncidente}
                            onChange={(time) => {
                                // Validar que no sea hora futura si es fecha de hoy
                                const fechaSeleccionada = formData.fechaIncidente;
                                const hoy = dayjsConZona();
                                
                                if (time && fechaSeleccionada) {
                                    const fechaEsHoy = fechaSeleccionada.isSame(hoy, 'day');
                                    
                                    if (fechaEsHoy) {
                                        // Si es hoy, verificar que la hora no sea futura
                                        const horaCompleta = fechaSeleccionada.hour(time.hour()).minute(time.minute());
                                        
                                        if (horaCompleta.isAfter(hoy)) {
                                            // Si la hora es futura, establecer la hora actual
                                            const horaActual = hoy;
                                            handleInputChange('horaIncidente', horaActual);
                                            setSnackbar({
                                                open: true,
                                                message: 'No se puede seleccionar una hora futura. Se estableció la hora actual.',
                                                severity: 'warning'
                                            });
                                            return;
                                        }
                                    }
                                }
                                
                                handleInputChange('horaIncidente', time);
                            }}
                            format="HH:mm"
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    fullWidth: true,
                                    className: 'bg-gray-50',
                                    sx: { '& .MuiInputBase-input': { fontSize: '0.775rem' } },
                                    /* helperText: formData.fechaIncidente?.isSame(dayjsConZona(), 'day') 
                                        ? 'Solo hasta la hora actual' 
                                        : 'Seleccione la hora', */
                                    inputProps: {
                                        placeholder: 'HH:MM'
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Dirección */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-700">
                            Dirección
                            {loadingLocation && (
                                <span className="ml-2 text-blue-600">
                                    <Loader className="w-3 h-3 inline animate-spin" />
                                    <span className="ml-1 text-xs">Obteniendo ubicación...</span>
                                </span>
                            )}
                        </label>
                        
                        {/* Botón de reintento para errores de ubicación */}
                        {errorLocation && !loadingLocation && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={requestPermission}
                                className="text-xs py-1 px-2 h-6"
                                sx={{ 
                                    fontSize: '0.7rem',
                                    minWidth: 'auto',
                                    padding: '2px 8px'
                                }}
                            >
                                <Navigation className="w-3 h-3 mr-1" />
                                Reintentar
                            </Button>
                        )}
                    </div>

                    {/* Alert para errores de permisos de ubicación */}
                    {errorLocation && (
                        <Alert 
                            severity={permissionStatus === 'denied' ? 'warning' : 'error'}
                            className="mb-2"
                            sx={{
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                '& .MuiAlert-message': {
                                    fontSize: '0.75rem',
                                    padding: '0px'
                                },
                                '& .MuiAlert-icon': {
                                    fontSize: '1rem',
                                }
                            }}
                        >
                            {permissionStatus === 'denied' 
                                ? '📱 Para obtener tu ubicación automáticamente, ve a Configuración > Safari > Ubicación > Permitir acceso'
                                : errorLocation
                            }
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        value={formData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                        className="bg-gray-50"
                        placeholder={loadingLocation ? "🔄 Obteniendo ubicación actual..." : errorLocation ? "✏️ Ingresa manualmente la dirección" : "📍 Ingrese la dirección del incidente"}
                        disabled={loadingLocation}
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                    />

                    {/* Estado de permisos y coordenadas */}
                    {coordenadasSeleccionadas.latitud && coordenadasSeleccionadas.longitud && (
                        <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-green-700">
                                    <span className="font-medium">Ubicación registrada:</span>
                                    <span className="ml-1">
                                        {coordenadasSeleccionadas.latitud.toFixed(6)}, {coordenadasSeleccionadas.longitud.toFixed(6)}
                                    </span>
                                </div>
                                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                    {coordenadasSeleccionadas.latitud === latitude && coordenadasSeleccionadas.longitud === longitude
                                        ? '📍 GPS actual'
                                        : '🗺️ Seleccionada'
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Indicador cuando no hay ubicación pero tampoco error */}
                    {!coordenadasSeleccionadas.latitud && !loadingLocation && !errorLocation && (
                        <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="text-xs text-yellow-700">
                                <span className="font-medium">⚠️ Sin ubicación GPS</span>
                                <span className="ml-1">- Ingresa la dirección manualmente o usa el mapa</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Jurisdicción y Botones */}
                <div className="space-y-1">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Jurisdicción
                                {loadingJurisdiccion && (
                                    <span className="ml-2 text-blue-600">
                                        <Loader className="w-3 h-3 inline animate-spin" />
                                        <span className="ml-1 text-xs">Detectando...</span>
                                    </span>
                                )}
                            </label>
                            <TextField
                                fullWidth
                                size="small"
                                value={formData.jurisdiccion}
                                onChange={(e) => handleInputChange('jurisdiccion', e.target.value)}
                                className="bg-gray-50"
                                placeholder="Ingrese la jurisdicción o detecte automáticamente"
                                disabled={loadingJurisdiccion}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Auto
                                </label>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    className="h-10 min-w-[50px]"
                                    onClick={handleDetectarJurisdiccion}
                                    disabled={loadingJurisdiccion || loadingLocation}
                                    title="Detectar jurisdicción automáticamente"
                                    color="primary"
                                >
                                    {loadingJurisdiccion ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Navigation className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Mapa
                                </label>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    className="h-10 min-w-[50px]"
                                    onClick={handleOpenMap}
                                    disabled={!latitude || !longitude}
                                    title={!latitude || !longitude ? "Esperando ubicación..." : "Ver mapa"}
                                >
                                    {loadingLocation ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <MapPin className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Mostrar información de la jurisdicción detectada */}
                    {jurisdiccionDetectada && (
                        <Alert
                            severity="success"
                            className="text-xs"
                            sx={{
                                fontSize: '0.75rem',
                                padding: '2px 8px', // reduce espacio interno
                                alignItems: 'center',
                                '& .MuiAlert-message': {
                                    fontSize: '0.75rem',
                                    padding: '0px'
                                },
                                '& .MuiAlert-icon': {
                                    fontSize: '1rem', // ícono más pequeño
                                },
                            }}
                        >
                            <strong>Jurisdicción detectada:</strong> {jurisdiccionDetectada.name}
                        </Alert>
                    )}

                    {/* Mostrar error de jurisdicción */}
                    {errorJurisdiccion && (
                        <Alert
                            severity="error"
                            className="text-xs"
                            sx={{
                                fontSize: '0.75rem',
                                padding: '0px', // reduce espacio interno
                                '& .MuiAlert-message': {
                                    fontSize: '0.75rem',
                                    padding: '0px'
                                },
                                '& .MuiAlert-icon': {
                                    fontSize: '1rem', // ícono más pequeño
                                },
                            }}
                        >
                            {errorJurisdiccion}
                        </Alert>
                    )}
                </div>

                {/* Descripción */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        size="small"
                        value={formData.descripcion}
                        onChange={(e) => handleInputChange('descripcion', e.target.value)}
                        className="bg-gray-50"
                        placeholder="Describa detalladamente el incidente..."
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                    />              
                </div>

                {/* Fotos */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fotos y Videos {formData.fotos.length > 0 && `(${formData.fotos.length}/4)`}
                    </label>
                    <Button
                        variant="outlined"
                        onClick={handleAgregarFoto}
                        size="small"
                        className="border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50"
                        startIcon={<Plus className="w-3 h-3" />}
                        sx={{ fontSize: '0.875rem' }}
                    >
                        Agregar Archivos
                    </Button>

                    {/* Vista previa de archivos seleccionados */}
                    {formData.fotos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {formData.fotos.map((archivo) => (
                                <div key={archivo.id} className="relative">
                                    {archivo.isVideo ? (
                                        <video
                                            src={archivo.preview}
                                            alt={archivo.name}
                                            className="w-full h-20 object-cover rounded border"
                                            muted
                                            onMouseOver={(e) => e.target.play()}
                                            onMouseOut={(e) => e.target.pause()}
                                        />
                                    ) : (
                                        <img
                                            src={archivo.preview}
                                            alt={archivo.name}
                                            className="w-full h-20 object-cover rounded border"
                                        />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                                        <div className="truncate" title={archivo.name}>
                                            {archivo.name}
                                        </div>
                                        {archivo.isVideo && (
                                            <div className="text-blue-300 text-xs">
                                                VIDEO
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botón Registrar */}
                <div className="pt-0">
                    {/* Barra de progreso */}
                    {loadingEnvio && (
                        <div className="mb-1">
                            <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: '#e5e7eb',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#22c55e',
                                        borderRadius: 3
                                    }
                                }}
                            />
                            <div className="text-center text-xs text-gray-600 mt-1">
                                {progress < 90 ? `Enviando incidencia... ${progress}%` : 'Procesando datos, por favor espere...'}
                            </div>
                        </div>
                    )}
                    
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="medium"
                        disabled={loadingEnvio || loadingUser}
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg"
                        sx={{
                            backgroundColor: '#22c55e',
                            fontSize: '0.875rem',
                            '&:hover': {
                                backgroundColor: '#16a34a'
                            }
                        }}
                    >
                        {loadingEnvio ? (
                            <div className="flex items-center gap-2">
                                <CircularProgress size={16} color="inherit" />
                                <span>Enviando...</span>
                            </div>
                        ) : (
                            'Registrar'
                        )}
                    </Button>
                </div>
            </form>

            {/* Modal del Mapa */}
            <MapModal
                open={mapModalOpen}
                onClose={handleCloseMap}
                latitude={latitude}
                longitude={longitude}
                address={address}
                onLocationSelect={handleLocationSelect}
            />

            {/* Modal de Subir Fotos */}
            <ModalSubirFotos
                open={fotosModalOpen}
                onClose={handleCloseFotosModal}
                fotos={formData.fotos}
                onFotosChange={handleFotosChange}
                subtipoSeleccionado={formData.subtipo}
            />

            {/* Snackbar para mensajes */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default RegistrarIncidencia;