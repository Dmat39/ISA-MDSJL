import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Chip, Grid } from '@mui/material';
import { X, MapPin, FileText, Camera, Calendar, Clock } from 'lucide-react';
import { dayjsConZona } from '../../utils/dayjsConfig';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const DetalleIncidenciaModal = ({ open, onClose, incidencia }) => {
    if (!incidencia) return null;

    const date = incidencia.doneAt
        ? dayjs.utc(incidencia.doneAt)
        : dayjsConZona(incidencia.fecha_ocurrencia + 'T' + incidencia.hora_ocurrencia);

    const getEstadoColor = (estado) => {
        switch (estado?.toUpperCase()) {
            case "APROBADO":
                return "success";
            case "RECHAZADO":
                return "error";
            case "PENDIENTE":
                return "warning";
            default:
                return "default";
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh',
                    margin: { xs: 2, sm: 4 },
                    width: { xs: 'calc(100% - 32px)', sm: 'auto' }
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)'
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pb: 1,
                px: 3,
                pt: 3
            }}>
                <Typography variant="h6" component="div" sx={{ 
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }, 
                    fontWeight: 600,
                    color: '#1f2937'
                }}>
                    Detalle de Incidencia
                </Typography>
                <IconButton 
                    onClick={onClose} 
                    size="small"
                    sx={{
                        color: '#6b7280',
                        '&:hover': {
                            backgroundColor: '#f3f4f6'
                        }
                    }}
                >
                    <X className="w-5 h-5" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    
                    {/* Estado y Código */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                            label={incidencia.estado?.toLowerCase() || 'Sin estado'} 
                            color={getEstadoColor(incidencia.estado)}
                            size="small"
                            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                        />
                        {incidencia.estado === "APROBADO" && incidencia.codigo_incidencia && (
                            <Typography variant="body2" sx={{ 
                                color: '#059669', 
                                fontWeight: 600,
                                fontSize: '0.875rem'
                            }}>
                                Código: {incidencia.codigo_incidencia}
                            </Typography>
                        )}
                    </Box>

                    {/* Fecha y Hora */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                {date.format('DD/MM/YYYY')}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Clock className="w-4 h-4 text-gray-500" />
                            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                {date.format('HH:mm')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Tipo y Subtipo */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ 
                            color: '#374151', 
                            fontWeight: 600, 
                            mb: 0.5,
                            fontSize: '0.875rem'
                        }}>
                            Tipo de Caso
                        </Typography>
                        <Typography variant="body2" sx={{ 
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            mb: 1
                        }}>
                            {incidencia.tipo || 'No especificado'}
                        </Typography>
                        
                        {incidencia.subtipo && (
                            <>
                                <Typography variant="body2" sx={{ 
                                    color: '#374151', 
                                    fontWeight: 600, 
                                    mb: 0.5,
                                    fontSize: '0.875rem'
                                }}>
                                    Subtipo
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    color: '#6b7280',
                                    fontSize: '0.875rem',
                                    mb: 1
                                }}>
                                    {incidencia.subtipo}
                                </Typography>
                            </>
                        )}
                    </Box>

                    {/* Dirección */}
                    {incidencia.direccion && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <Typography variant="body2" sx={{ 
                                    color: '#374151', 
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}>
                                    Dirección
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ 
                                color: '#6b7280',
                                fontSize: '0.875rem',
                                pl: 2.5
                            }}>
                                {incidencia.direccion}
                            </Typography>
                        </Box>
                    )}

                    {/* Jurisdicción */}
                    {incidencia.jurisdiccion && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ 
                                color: '#374151', 
                                fontWeight: 600, 
                                mb: 0.5,
                                fontSize: '0.875rem'
                            }}>
                                Jurisdicción
                            </Typography>
                            <Typography variant="body2" sx={{ 
                                color: '#6b7280',
                                fontSize: '0.875rem'
                            }}>
                                {incidencia.jurisdiccion}
                            </Typography>
                        </Box>
                    )}

                    {/* Descripción */}
                    {incidencia.descripcion && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <FileText className="w-4 h-4 text-gray-500" />
                                <Typography variant="body2" sx={{ 
                                    color: '#374151', 
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}>
                                    Descripción
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ 
                                color: '#6b7280',
                                fontSize: '0.875rem',
                                pl: 2.5,
                                lineHeight: 1.5
                            }}>
                                {incidencia.descripcion}
                            </Typography>
                        </Box>
                    )}

                    {/* Fotos */}
                    {/* {incidencia.fotos && incidencia.fotos.length > 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Camera className="w-4 h-4 text-gray-500" />
                                <Typography variant="body2" sx={{ 
                                    color: '#374151', 
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}>
                                    Fotos ({incidencia.fotos.length})
                                </Typography>
                            </Box>
                            <Grid container spacing={1} sx={{ pl: 2.5 }}>
                                {incidencia.fotos.map((foto, index) => (
                                    <Grid item xs={6} sm={4} key={index}>
                                        <Box
                                            component="img"
                                            src={foto}
                                            alt={`Foto ${index + 1}`}
                                            sx={{
                                                width: '100%',
                                                height: 120,
                                                objectFit: 'cover',
                                                borderRadius: 1,
                                                border: '1px solid #e5e7eb'
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
 */}
                    {/* Mensaje si no hay fotos */}
                    {/* {(!incidencia.fotos || incidencia.fotos.length === 0) && (
                        <Box sx={{ 
                            textAlign: 'center', 
                            py: 2,
                            color: '#9ca3af',
                            fontSize: '0.875rem'
                        }}>
                            No hay fotos adjuntas
                        </Box>
                    )} */}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default DetalleIncidenciaModal; 