import { Button, FormControl, Input, InputLabel, MenuItem, Popover, Select, Tooltip, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { dayjsConZona } from "../../utils/dayjsConfig";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { incidenceApi } from "../../utils/axiosConfig";
import { setUser } from "../../redux/slices/AuthSlice";

const FiltroIncidencias = ({ iconButtonStyle, inicio, setInicio, fin, setFin, estado, setEstado, refetch }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const dispatch = useDispatch();
    const { user, token } = useSelector((state) => state.auth);
    const [phone, setPhone] = useState("");
    const [savingPhone, setSavingPhone] = useState(false);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    useEffect(() => {
        if (open) {
            setPhone(user?.celular || "");
        }
    }, [open, user]);

    const handleSavePhone = async () => {
        if (!phone) return;
        try {
            setSavingPhone(true);
            await incidenceApi.patch('/api/serenos/phone', { celular: phone });
            dispatch(setUser({ token, data: { ...user, celular: phone } }));
            toast.success('Número de celular actualizado');
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || 'Error actualizando celular';
            toast.error(msg);
        } finally {
            setSavingPhone(false);
        }
    };

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
                                    textField: { 
                                        size: 'small',
                                        inputProps: {
                                            placeholder: 'DD/MM/YYYY'
                                        }
                                    },
                                }}
                                format="DD/MM/YYYY"
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
                                    textField: { 
                                        size: 'small',
                                        inputProps: {
                                            placeholder: 'DD/MM/YYYY'
                                        }
                                    },
                                }}
                                format="DD/MM/YYYY"
                                value={dayjsConZona(fin)}
                                onChange={(date) => {
                                    setFin(dayjsConZona(date).format('YYYY-MM-DD'));
                                    queueMicrotask(refetch);
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-sm font-medium">Celular</span>
                        <div className="flex gap-2">
                            <TextField
                                size="small"
                                value={phone}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
                                    setPhone(v);
                                }}
                                placeholder="Ingrese celular"
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleSavePhone}
                                disabled={savingPhone || phone === (user?.celular || "")}
                            >
                                {savingPhone ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Popover>
        </>
    )
}

export default FiltroIncidencias