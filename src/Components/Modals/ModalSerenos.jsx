import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    FormControl,
    Select,
    MenuItem,
    Button,
    Typography,
    useMediaQuery,
    useTheme,
    Alert,
    TextField,
    InputAdornment
} from '@mui/material';
import { X, Users, Search } from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers';
import CustomTable from '../Tabla/CustomTable';
import { dayjsConZona } from '../../utils/dayjsConfig';
import useSerenos from '../../hooks/serenos/useSerenos';

const ModalSerenos = ({ open, onClose, embedded = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [fecha, setFecha] = useState(dayjsConZona().format('YYYY-MM-DD'));
    const [turno, setTurno] = useState('mañana'); // Valor por defecto
    const [jurisdiccion, setJurisdiccion] = useState(2); // Valor por defecto: Zárate

    // Estados para paginación
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Hook para obtener datos de serenos
    const { data, loading, count, error, refetch } = useSerenos({
        searchTerm,
        fecha,
        turno,
        jurisdiccion,
        page,
        limit
    });

    // Opciones para los filtros
    const turnosOptions = [
        { value: 'mañana', label: 'Mañana' },
        { value: 'tarde', label: 'Tarde' },
        { value: 'noche', label: 'Noche' }
    ];

    const jurisdiccionesOptions = [
        { value: 2, label: 'Zárate' },
        { value: 3, label: 'La Huayrona' },
        { value: 4, label: 'Canto Rey' },
        { value: 5, label: 'Santa Elizabeth' },
        { value: 6, label: 'Bayobar' },
        { value: 7, label: 'Mariscal Caceres' },
        { value: 8, label: '10 de Octubre' },
        { value: 1, label: 'Caja de Agua' }
    ];

    // Columnas para la tabla
    const columns = [
        {
            key: 'sereno',
            label: 'SERENOS',
            render: (row) => row.nombres_completos || `${row.nombres || ''} ${row.apellidos || ''}`.trim()
        },
        {
            key: 'codigos',
            label: 'CÓDIGOS',
            render: (row) => {
                if (Array.isArray(row.codigos)) {
                    return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {row.codigos.map((codigo, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 500,
                                        border: '1px solid #bbdefb'
                                    }}
                                >
                                    {codigo}
                                </Box>
                            ))}
                        </Box>
                    );
                }
                const codigo = row.codigo || row.codigos;
                return codigo ? (
                    <Box
                        sx={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            border: '1px solid #bbdefb',
                            display: 'inline-block'
                        }}
                    >
                        {codigo}
                    </Box>
                ) : '—';
            }
        },
        {
            key: 'cuenta',
            label: 'CUENTA',
            render: (row) => {
                const cuenta = Array.isArray(row.codigos)
                    ? row.codigos.length
                    : (row.cuenta || (row.codigo ? 1 : 0));

                return (
                    <Box
                        sx={{
                            backgroundColor: cuenta > 0 ? '#e8f5e8' : '#fafafa',
                            color: cuenta > 0 ? '#2e7d32' : '#666',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: `1px solid ${cuenta > 0 ? '#c8e6c9' : '#e0e0e0'}`,
                            display: 'inline-block',
                            minWidth: '24px',
                            textAlign: 'center'
                        }}
                    >
                        {cuenta}
                    </Box>
                );
            }
        }
    ];

    // Función para manejar cambios de página y límite
    const handlePageLimitChange = (newPage, newLimit) => {
        setPage(newPage);
        setLimit(newLimit);
    };

    // Función para limpiar filtros
    const clearFilters = () => {
        setSearchTerm('');
        setFecha(dayjsConZona().format('YYYY-MM-DD'));
        setTurno('mañana'); // Restablecer a valor por defecto
        setJurisdiccion(2); // Restablecer a valor por defecto: Zárate
    };

    // Contenido principal del componente
    const mainContent = (
        <>
            {/* Header - solo mostrar si no está embebido */}
            {!embedded && (
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: { xs: '12px 16px', sm: '16px 24px' }
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Users className="w-5 h-5 text-blue-600" />
                        <Typography variant="h6" component="div" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 700 }}>
                            Historial de Serenos
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                    >
                        <X className="w-5 h-5" />
                    </IconButton>
                </DialogTitle>
            )}

            <Box sx={{ 
                padding: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                height: embedded ? '100%' : 'auto',
                flex: embedded ? 1 : 'none'
            }}>
                {/* Filtros */}
                <Box
                    sx={{
                        padding: { xs: '12px', sm: '20px' },
                        borderBottom: '1px solid #e0e0e0',
                        backgroundColor: '#f8f9fa'
                    }}
                >
                    {/* Primera fila: Campo de búsqueda */}
                    <Box sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            Buscar sereno
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar sereno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search className="w-4 h-4 text-gray-400" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    {/* Contenedor de filtros responsive */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '2fr 1fr', sm: 'repeat(2, 1fr)' },
                            gap: { xs: 1, sm: 2 },
                            mb: 1
                        }}
                    >
                        {/* Filtro de Jurisdicción */}
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                Jurisdicción
                            </Typography>
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={jurisdiccion}
                                    onChange={(e) => setJurisdiccion(e.target.value)}
                                    displayEmpty
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            height: '40px' // Altura fija para consistencia
                                        }
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Seleccionar una Jurisdicción
                                    </MenuItem>
                                    {jurisdiccionesOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Filtro de Turno */}
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                Turno
                            </Typography>
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={turno}
                                    onChange={(e) => setTurno(e.target.value)}
                                    displayEmpty
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            height: '40px' // Altura fija para consistencia
                                        }
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Seleccionar
                                    </MenuItem>
                                    {turnosOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>


                        {/* Filtro de Fecha */}
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                Fecha
                            </Typography>
                            <DatePicker
                                value={dayjsConZona(fecha)}
                                onChange={(date) => setFecha(dayjsConZona(date).format('YYYY-MM-DD'))}
                                format="DD/MM/YYYY"
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                        inputProps: {
                                            placeholder: 'DD/MM/YYYY'
                                        },
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                height: '40px',
                                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>


                        {/* Botón para limpiar filtros */}
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, visibility: 'hidden' }}>
                                Placeholder
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={clearFilters}
                                fullWidth
                                sx={{
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                    height: '40px',
                                    padding: { xs: '0 8px', sm: '0 16px' },
                                    minWidth: 'auto'
                                }}
                            >
                                Limpiar FILTRO
                            </Button>
                        </Box>
                    </Box>


                </Box>

                {/* Tabla */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <CustomTable
                        data={data}
                        loading={loading}
                        columns={columns}
                        count={count}
                        page={page}
                        limit={limit}
                        handlePageLimitChange={handlePageLimitChange}
                        noDataText="No se encontraron serenos para los filtros seleccionados"
                    />
                </Box>
            </Box>
        </>
    );

    // Si está embebido, devolver solo el contenido
    if (embedded) {
        return mainContent;
    }

    // Si no está embebido, envolver en Dialog
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: isMobile ? 0 : 0,
                    margin: isMobile ? 0 : '32px',
                    height: isMobile ? '100dvh' : 'auto',
                    maxHeight: isMobile ? '100dvh' : '100dvh'
                }
            }}
        >
            {mainContent}
        </Dialog>
    );
};

export default ModalSerenos;