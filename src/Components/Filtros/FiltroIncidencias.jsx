import { Button, FormControl, Input, InputLabel, MenuItem, Popover, Select, Tooltip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Filter } from "lucide-react";
import { useState } from "react";
import { dayjsConZona } from "../../utils/dayjsConfig";

const FiltroIncidencias = ({ iconButtonStyle, inicio, setInicio, fin, setFin, estado, setEstado, refetch }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    return (
        <>
            <Tooltip title="Filtros" arrow>
                <Button onClick={handleClick} aria-describedby={id} variant="outlined" size="small" style={iconButtonStyle()}>
                    <Filter className="w-4 h-4" />
                </Button>
            </Tooltip>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                aria-hidden={false}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        borderRadius: '8px',
                    },
                }}
            >
                <div className="space-y-4 max-w-sm p-4">
                    <div>
                        <span htmlFor="estado" className="text-sm font-medium">
                            Estado
                        </span>
                        <FormControl
                            size="small"
                            fullWidth

                        >
                            <Select
                                labelId="estado-label"
                                value={estado}
                                displayEmpty
                                onChange={(e) => {
                                    setEstado(e.target.value);
                                    queueMicrotask(refetch);
                                }}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="APROBADO">Aprobado</MenuItem>
                                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                                <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                            </Select>
                        </FormControl>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                            <span htmlFor="fechaInicio" className="text-sm font-medium">
                                Fecha inicio
                            </span>
                            <DatePicker
                                slotProps={{
                                    textField: { size: 'small' },
                                }}
                                value={dayjsConZona(inicio)}
                                onChange={(date) => {
                                    setInicio(dayjsConZona(date).format('YYYY-MM-DD'));
                                    queueMicrotask(refetch);
                                }}
                            />
                        </div>
                        <div>
                            <span htmlFor="fechaFin" className="text-sm font-medium">
                                Fecha fin
                            </span>
                            <DatePicker
                                slotProps={{
                                    textField: { size: 'small' },
                                }}
                                value={dayjsConZona(fin)}
                                onChange={(date) => {
                                    setFin(dayjsConZona(date).format('YYYY-MM-DD'));
                                    queueMicrotask(refetch);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </Popover>
        </>
    )
}

export default FiltroIncidencias