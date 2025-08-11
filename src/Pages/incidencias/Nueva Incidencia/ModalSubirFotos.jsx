import React, { useState, useRef } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Box, 
    Typography, 
    IconButton,
    Alert,
    LinearProgress,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import { 
    CloudUpload, 
    Close, 
    Delete, 
    Image as ImageIcon,
    PhotoCamera,
    Videocam,
    CameraAlt,
    VideoCall
} from '@mui/icons-material';

const ModalSubirFotos = ({ open, onClose, fotos, onFotosChange, subtipoSeleccionado }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaStream, setMediaStream] = useState(null);
    const [recordedBlob, setRecordedBlob] = useState(null);
    
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // Subtipos que permiten videos
    const SUBTIPOS_CON_VIDEO = [2127, 2130, 2131, 2134, 2135, 2137, 2147, 2178, 2179, 2185, 2193, 12199, 12200];
    
    const MAX_FOTOS = 4;
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const MAX_VIDEO_DURATION = 20; // segundos
    const MAX_VIDEO_SIZE_MB = 50; // MB para videos
    const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
    
    const FORMATOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const FORMATOS_VIDEO_PERMITIDOS = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/quicktime', 'video/x-msvideo'];
    
    // Verificar si el subtipo seleccionado permite videos
    const permiteVideo = subtipoSeleccionado && SUBTIPOS_CON_VIDEO.includes(parseInt(subtipoSeleccionado));
    
    // Obtener formatos permitidos según el subtipo
    const getFormatosPermitidos = () => {
        if (permiteVideo) {
            return [...FORMATOS_PERMITIDOS, ...FORMATOS_VIDEO_PERMITIDOS];
        }
        return FORMATOS_PERMITIDOS;
    };

    const validarArchivo = async (file) => {
        // Validar tipo de archivo
        const formatosPermitidos = getFormatosPermitidos();
        if (!formatosPermitidos.includes(file.type)) {
            return `El archivo ${file.name} no es un formato válido. Formatos permitidos: ${permiteVideo ? 'JPG, PNG, GIF, WEBP, MP4, AVI, MOV, WMV' : 'JPG, PNG, GIF, WEBP'}`;
        }

        // Validar tamaño según tipo de archivo
        const esVideo = file.type.startsWith('video/');
        const maxSize = esVideo ? MAX_VIDEO_SIZE_BYTES : MAX_SIZE_BYTES;
        const maxSizeMB = esVideo ? MAX_VIDEO_SIZE_MB : MAX_SIZE_MB;
        
        if (file.size > maxSize) {
            return `El archivo ${file.name} excede el tamaño máximo de ${maxSizeMB}MB`;
        }

        // Validar duración del video si es video
        if (esVideo) {
            try {
                const duracion = await obtenerDuracionVideo(file);
                if (duracion > MAX_VIDEO_DURATION) {
                    return `El video ${file.name} excede la duración máxima de ${MAX_VIDEO_DURATION} segundos`;
                }
            } catch (err) {
                return `Error al validar la duración del video ${file.name}`;
            }
        }

        return null;
    };

    const obtenerDuracionVideo = (file) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };
            
            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                reject(new Error('Error al cargar el video'));
            };
            
            video.src = URL.createObjectURL(file);
        });
    };

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        setError('');
        setLoading(true);

        try {
            // Validar cantidad total
            if (fotos.length + files.length > MAX_FOTOS) {
                setError(`Solo puedes subir un máximo de ${MAX_FOTOS} archivos. Actualmente tienes ${fotos.length} archivo(s).`);
                setLoading(false);
                return;
            }

            const nuevosArchivos = [];

            for (const file of files) {
                // Validar cada archivo
                const errorValidacion = await validarArchivo(file);
                if (errorValidacion) {
                    setError(errorValidacion);
                    setLoading(false);
                    return;
                }

                // Crear preview del archivo
                const preview = await crearPreview(file);
                
                nuevosArchivos.push({
                    id: Date.now() + Math.random(),
                    file: file,
                    preview: preview,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    isVideo: file.type.startsWith('video/')
                });
            }

            // Agregar los nuevos archivos
            onFotosChange([...fotos, ...nuevosArchivos]);
            
        } catch (err) {
            setError('Error al procesar los archivos');
            console.error('Error:', err);
        } finally {
            setLoading(false);
            // Limpiar el input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const crearPreview = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    const eliminarArchivo = (archivoId) => {
        const archivosActualizados = fotos.filter(archivo => archivo.id !== archivoId);
        onFotosChange(archivosActualizados);
        setError('');
    };

    const formatearTamaño = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Funciones para grabación de video
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Cámara trasera por defecto
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: true
            });
            
            setMediaStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Error al acceder a la cámara: ' + err.message);
        }
    };

    const stopCamera = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startRecording = () => {
        if (!mediaStream) return;

        chunksRef.current = [];
        const mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
                ? 'video/webm;codecs=vp9' 
                : MediaRecorder.isTypeSupported('video/webm') 
                    ? 'video/webm' 
                    : 'video/mp4'
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
            setRecordedBlob(blob);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const saveRecordedVideo = async () => {
        if (!recordedBlob) return;

        try {
            setLoading(true);
            
            // Crear archivo con nombre y tipo apropiado
            const fileName = `video_${Date.now()}.${recordedBlob.type.includes('webm') ? 'webm' : 'mp4'}`;
            const file = new File([recordedBlob], fileName, { type: recordedBlob.type });

            // Validar el archivo grabado
            const errorValidacion = await validarArchivo(file);
            if (errorValidacion) {
                setError(errorValidacion);
                return;
            }

            // Crear preview
            const preview = URL.createObjectURL(recordedBlob);
            
            const nuevoVideo = {
                id: Date.now() + Math.random(),
                file: file,
                preview: preview,
                name: fileName,
                size: recordedBlob.size,
                type: recordedBlob.type,
                isVideo: true
            };

            onFotosChange([...fotos, nuevoVideo]);
            setRecordedBlob(null);
            
        } catch (err) {
            setError('Error al guardar el video grabado');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        stopCamera();
        setRecordedBlob(null);
        setIsRecording(false);
        setActiveTab(0);
        onClose();
    };

    return (
        <>
            <style>
                {`
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }
                `}
            </style>
            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        maxHeight: '80vh'
                    }
                }}
                BackdropProps={{
                    sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)'
                    }
                }}
            >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pb: 1
            }}>
                <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    Agregar Fotos y Videos ({fotos.length}/{MAX_FOTOS})
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                {/* Tabs para seleccionar modo */}
                {permiteVideo && (
                    <Tabs 
                        value={activeTab} 
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{ mb: 2 }}
                    >
                        <Tab label="Subir archivos" />
                        <Tab label="Grabar video" />
                    </Tabs>
                )}

                {/* Información */}
                <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
                    • Máximo {MAX_FOTOS} archivos, 10 MB por archivo, formatos de imagen: JPG, PNG, GIF, WEBP.
                    {permiteVideo && (
                        <>
                            <br />
                            • Videos: Máximo {MAX_VIDEO_SIZE_MB}MB y 15 segundos, formatos: MP4, AVI, WMV, MOV, H.264.
                        </>
                    )}
                </Alert>

                {/* Indicador de subtipo con video */}
                {permiteVideo && (
                    <Alert severity="success" sx={{ mb: 2, fontSize: '0.875rem' }}>
                        <strong>Subtipo seleccionado permite videos:</strong> Puedes subir videos de máximo 15 segundos
                    </Alert>
                )}

                {/* Error */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
                        {error}
                    </Alert>
                )}

                {/* Loading */}
                {loading && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress />
                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                            Procesando archivos...
                        </Typography>
                    </Box>
                )}

                {/* Contenido según la pestaña activa */}
                {activeTab === 0 ? (
                    // Pestaña: Subir archivos
                    <Box
                        sx={{
                            border: '2px dashed #ccc',
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center',
                            mb: 3,
                            backgroundColor: fotos.length >= MAX_FOTOS ? '#f5f5f5' : '#fafafa',
                            cursor: fotos.length >= MAX_FOTOS ? 'not-allowed' : 'pointer',
                            '&:hover': {
                                borderColor: fotos.length >= MAX_FOTOS ? '#ccc' : '#1976d2',
                                backgroundColor: fotos.length >= MAX_FOTOS ? '#f5f5f5' : '#f0f7ff'
                            }
                        }}
                        onClick={() => {
                            if (fotos.length < MAX_FOTOS && !loading) {
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            accept={permiteVideo ? "image/*,video/*" : "image/*"}
                            style={{ display: 'none' }}
                            disabled={fotos.length >= MAX_FOTOS || loading}
                        />
                        
                        <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            {fotos.length >= MAX_FOTOS 
                                ? 'Límite de archivos alcanzado' 
                                : 'Haz clic aquí o arrastra los archivos'
                            }
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {fotos.length < MAX_FOTOS && `Puedes agregar ${MAX_FOTOS - fotos.length} archivo(s) más`}
                        </Typography>
                        {permiteVideo && (
                            <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 600 }}>
                                Videos permitidos para este subtipo
                            </Typography>
                        )}
                    </Box>
                ) : (
                    // Pestaña: Grabar video
                    <Box sx={{ mb: 3 }}>
                        {/* Vista previa de la cámara */}
                        {mediaStream && (
                            <Box sx={{ 
                                border: '2px solid #ddd', 
                                borderRadius: 2, 
                                overflow: 'hidden', 
                                mb: 2,
                                position: 'relative'
                            }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    style={{
                                        width: '100%',
                                        height: '300px',
                                        objectFit: 'cover'
                                    }}
                                />
                                {isRecording && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        backgroundColor: 'red',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 20,
                                        height: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        animation: 'pulse 1s infinite'
                                    }}>
                                        <Box sx={{
                                            width: 8,
                                            height: 8,
                                            backgroundColor: 'white',
                                            borderRadius: '50%'
                                        }} />
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Controles de grabación */}
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            {!mediaStream ? (
                                <Button
                                    variant="contained"
                                    startIcon={<CameraAlt />}
                                    onClick={startCamera}
                                    disabled={loading}
                                >
                                    Abrir Cámara
                                </Button>
                            ) : (
                                <>
                                    {!isRecording ? (
                                        <Button
                                            variant="contained"
                                            color="error"
                                            startIcon={<VideoCall />}
                                            onClick={startRecording}
                                            disabled={loading}
                                        >
                                            Iniciar Grabación
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={stopRecording}
                                            disabled={loading}
                                        >
                                            Detener Grabación
                                        </Button>
                                    )}
                                    <Button
                                        variant="outlined"
                                        onClick={stopCamera}
                                        disabled={isRecording || loading}
                                    >
                                        Cerrar Cámara
                                    </Button>
                                </>
                            )}
                        </Box>

                        {/* Video grabado */}
                        {recordedBlob && (
                            <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Video grabado:
                                </Typography>
                                <video
                                    src={URL.createObjectURL(recordedBlob)}
                                    controls
                                    style={{
                                        width: '100%',
                                        maxHeight: '200px',
                                        objectFit: 'contain'
                                    }}
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={saveRecordedVideo}
                                        disabled={loading}
                                    >
                                        Guardar Video
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setRecordedBlob(null)}
                                    >
                                        Descartar
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Vista previa de archivos */}
                {fotos.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                            Archivos seleccionados:
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                            gap: 2 
                        }}>
                            {fotos.map((archivo) => (
                                <Box
                                    key={archivo.id}
                                    sx={{
                                        position: 'relative',
                                        border: '1px solid #ddd',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        backgroundColor: '#fff'
                                    }}
                                >
                                    {archivo.isVideo ? (
                                        <video
                                            src={archivo.preview}
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                objectFit: 'cover'
                                            }}
                                            muted
                                            onMouseOver={(e) => e.target.play()}
                                            onMouseOut={(e) => e.target.pause()}
                                        />
                                    ) : (
                                        <img
                                            src={archivo.preview}
                                            alt={archivo.name}
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    )}
                                    <Box sx={{ p: 1 }}>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                display: 'block',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                fontSize: '0.7rem'
                                            }}
                                            title={archivo.name}
                                        >
                                            {archivo.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                            {formatearTamaño(archivo.size)}
                                        </Typography>
                                        {archivo.isVideo && (
                                            <Chip 
                                                label="VIDEO" 
                                                size="small" 
                                                color="primary" 
                                                sx={{ 
                                                    fontSize: '0.6rem', 
                                                    height: '16px',
                                                    mt: 0.5
                                                }} 
                                            />
                                        )}
                                    </Box>
                                    <IconButton
                                        onClick={() => eliminarArchivo(archivo.id)}
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)'
                                            },
                                            width: 24,
                                            height: 24
                                        }}
                                        size="small"
                                    >
                                        <Delete sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} variant="outlined" size="small">
                    Cancelar
                </Button>
                <Button 
                    onClick={handleClose} 
                    variant="contained" 
                    size="small"
                    disabled={fotos.length === 0}
                    sx={{ 
                        backgroundColor: '#22c55e',
                        '&:hover': { backgroundColor: '#16a34a' }
                    }}
                >
                    Confirmar ({fotos.length} archivo{fotos.length !== 1 ? 's' : ''})
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
};

export default ModalSubirFotos;