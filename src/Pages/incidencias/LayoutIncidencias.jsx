import { Button, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import { Filter, List, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import ListaIncidencias from './ListaIncidencias';
import UseIncidencias from '../../hooks/incidencias/UseIncidencias';
import { dayjsConZona } from '../../utils/dayjsConfig';
import FiltroIncidencias from '../../Components/Filtros/FiltroIncidencias';
import { usePersistedState } from '../../hooks/LocalStorage/UsePersistState';
import ModalSerenos from '../../Components/Modals/ModalSerenos';
import useRole from '../../hooks/useRole';
// import MapaIncidencias from './MapaIncidencias';

const LayoutIncidencias = () => {
    const navigate = useNavigate();
    const { canAccessHistorial } = useRole();
    const [view, setView] = useState('list');
    const [modalSerenasOpen, setModalSerenasOpen] = useState(false);

    const defaultFecha = dayjsConZona().format('YYYY-MM-DD')
    const [inicio, setInicio] = usePersistedState('inicio', defaultFecha);
    const [fin, setFin] = usePersistedState('fin', defaultFecha);
    const [estado, setEstado] = usePersistedState('estado', "");
    const [hasScrolled, setHasScrolled] = useState(false);
    const sentinelRef = useRef(null);

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([e]) => setHasScrolled(!e.isIntersecting),
            { threshold: 0 }
        );
        const current = sentinelRef.current;
        if (current) observer.observe(current);
        return () => current && observer.unobserve(current);
    }, []);

    const { data, refetch, isFetching } = UseIncidencias({ inicio, fin, estado });

    return (
        <div className="h-full flex flex-col">
            <div ref={sentinelRef} className="h-1" />

            <div className={`px-6 mb-4 sticky top-0 z-10 p-4 transition-all duration-300 ${hasScrolled ? 'shadow-md bg-white' : ' bg-gray-50'}`}>
                <div className='flex items-center justify-between max-w-md container mx-auto'>
                    <h1 className="text-2xl font-bold text-gray-900">Incidencias</h1>
                    <div className="flex gap-2">
                        {canAccessHistorial() && (
                            <Tooltip title="Historial de Serenos" arrow>
                                <Button
                                    onClick={() => navigate('/historial')}
                                    variant="outlined"
                                    size="small"
                                    style={iconButtonStyle()}
                                >
                                    <Users className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        <FiltroIncidencias
                            iconButtonStyle={iconButtonStyle}
                            inicio={inicio}
                            setInicio={setInicio}
                            fin={fin}
                            setFin={setFin}
                            estado={estado}
                            setEstado={setEstado}
                            refetch={refetch}
                        />
                        {/* Botones de cambio de vista deshabilitados */}
                        <ToggleButtonGroup
                            value={view}
                            exclusive
                            onChange={handleViewChange}
                            size="small"
                            style={{ display: 'none' }}
                        >
                            <Tooltip title="Lista" arrow>
                                <ToggleButton
                                    value="list"
                                    style={toggleStyle(true, '8px 0 0 8px')}
                                >
                                    <List className="w-4 h-4" />
                                </ToggleButton>
                            </Tooltip>
                        </ToggleButtonGroup>
                    </div>
                </div>
            </div>

            <div className='pb-5 px-6 container mx-auto max-w-md flex-1 flex flex-col'>
                {/* Contadores */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-3" style={CardStyle}>
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{data?.countState?.APROBADO || 0}</div>
                            <div className="text-xs text-gray-600">Aprobados</div>
                        </div>
                    </div>
                    <div className="p-3" style={CardStyle}>
                        <div className="text-center">
                            <div className="text-lg font-bold text-yellow-600">{data?.countState?.PENDIENTE || 0}</div>
                            <div className="text-xs text-gray-600">Pendientes</div>
                        </div>
                    </div>
                    <div className="p-3" style={CardStyle}>
                        <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{data?.countState?.RECHAZADO || 0}</div>
                            <div className="text-xs text-gray-600">Rechazados</div>
                        </div>
                    </div>
                </div>

                {/* incidencias */}

                {
                    view === 'list' &&
                    <ListaIncidencias
                        data={data?.data || []}
                        inicio={inicio}
                        fin={fin}
                        estado={estado}
                        isFetching={isFetching}
                    />
                }


                {/** Vista de mapa deshabilitada */}
            </div>

            {/* Modal de Serenos */}
            <ModalSerenos
                open={modalSerenasOpen}
                onClose={() => setModalSerenasOpen(false)}
            />
        </div>
    )
}

const iconButtonStyle = (radius = '8px') => ({
    minWidth: '32px',
    width: '40px',
    height: '40px',
    padding: 0,
    borderRadius: radius,
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    color: '#333',
});

const toggleStyle = (active, radius) => ({
    minWidth: '32px',
    width: '40px',
    height: '40px',
    padding: 0,
    borderRadius: radius,
    border: '1px solid #e0e0e0',
    backgroundColor: active ? '#eee' : '#fff',
    boxShadow: active
        ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
        : 'none',
    color: '#333',
});

const CardStyle = {
    color: '#333',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
};


export default LayoutIncidencias