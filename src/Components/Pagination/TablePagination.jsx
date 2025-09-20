import React from 'react';
import { Pagination, FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';

const CustomTablePagination = ({ count, page, limit, handlePageLimitChange }) => {
    const totalPages = Math.ceil(count / limit) || 1;

    const handlePageChange = (event, value) => {
        handlePageLimitChange(value, limit);
    };

    const handleLimitChange = (event) => {
        const newLimit = event.target.value;
        handlePageLimitChange(1, newLimit); // Reset a página 1 cuando cambia el límite
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 1 },
                width: '100%',
                marginY: 1
            }}
        >
            {/* Información de resultados (centrada en móvil) */}
            <Box
                sx={{
                    display: { xs: 'flex', sm: 'none' },
                    justifyContent: 'center',
                    order: { xs: 1 }
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        textAlign: 'center'
                    }}
                >
                    Mostrando {Math.min((page - 1) * limit + 1, count)} - {Math.min(page * limit, count)} de {count} resultados
                </Typography>
            </Box>

            {/* Contenedor principal para desktop */}
            <Box
                sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    width: '100%',
                    gap: 2
                }}
            >
                {/* Información de resultados (desktop) */}
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                    }}
                >
                    Mostrando {Math.min((page - 1) * limit + 1, count)} - {Math.min(page * limit, count)} de {count} resultados
                </Typography>

                {/* Espaciador flexible */}
                <Box sx={{ flex: 1 }} />

                {/* Selector de filas (10% del ancho) */}
                <FormControl
                    size="small"
                    variant="outlined"
                    sx={{
                        width: '10%',
                        minWidth: '80px',
                        maxWidth: '120px'
                    }}
                >
                    <InputLabel>Filas</InputLabel>
                    <Select
                        value={limit}
                        onChange={handleLimitChange}
                        label="Filas"
                    >
                        <MenuItem value={5} disabled={count <= 5}>5</MenuItem>
                        <MenuItem value={10} disabled={count <= 10}>10</MenuItem>
                        <MenuItem value={20} disabled={count <= 20}>20</MenuItem>
                        <MenuItem value={50} disabled={count <= 50}>50</MenuItem>
                        <MenuItem value={100} disabled={count <= 100}>100</MenuItem>
                    </Select>
                </FormControl>

                {/* Paginación */}
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    variant="outlined"
                    shape="rounded"
                    size="small"
                    showFirstButton={totalPages > 3}
                    showLastButton={totalPages > 3}
                    siblingCount={0}
                    boundaryCount={1}
                    sx={{
                        '& .MuiPagination-ul': {
                            flexWrap: 'nowrap'
                        },
                        '& .MuiPaginationItem-root': {
                            border: '1px solid',
                            borderColor: 'divider'
                        }
                    }}
                />
            </Box>

            {/* Contenedor para móvil */}
            <Box
                sx={{
                    display: { xs: 'flex', sm: 'none' },
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 2,
                    order: { xs: 2 }
                }}
            >
                {/* Selector de filas (móvil) */}
                <FormControl
                    size="small"
                    variant="outlined"
                    sx={{
                        width: '10%',
                        minWidth: '80px',
                        maxWidth: '120px',
                        marginLeft: '2rem'
                    }}
                >
                    <InputLabel>Filas</InputLabel>
                    <Select
                        value={limit}
                        onChange={handleLimitChange}
                        label="Filas"
                    >
                        <MenuItem value={5} disabled={count <= 5}>5</MenuItem>
                        <MenuItem value={10} disabled={count <= 10}>10</MenuItem>
                        <MenuItem value={20} disabled={count <= 20}>20</MenuItem>
                        <MenuItem value={50} disabled={count <= 50}>50</MenuItem>
                    </Select>
                </FormControl>

                {/* Paginación (móvil) */}
                <Box sx={{ display: 'flex', justifyContent: 'center', marginRight: '2rem', alignContent: 'center' }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        variant="outlined"
                        shape="rounded"
                        size="small"
                        showFirstButton={totalPages > 3}
                        showLastButton={totalPages > 3}
                        siblingCount={0}
                        boundaryCount={1}
                        sx={{
                            '& .MuiPagination-ul': {
                                flexWrap: 'nowrap'
                            },
                            '& .MuiPaginationItem-root': {
                                border: '1px solid',
                                borderColor: 'divider'
                            }
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default CustomTablePagination; 