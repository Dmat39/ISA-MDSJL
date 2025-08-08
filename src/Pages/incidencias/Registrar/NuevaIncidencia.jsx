import {
    CircularProgress,
    FormControl,
    MenuItem,
    Select,
    TextField,
    Zoom
} from "@mui/material";
import {
    DatePicker,
    TimePicker
} from "@mui/x-date-pickers";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    useMap,
    useMapEvents
} from "react-leaflet";
import { useFormik } from "formik";
import * as Yup from "yup";
import L from "leaflet";
import { toast } from "sonner";
import { dayjsConZona } from "../../../utils/dayjsConfig";

const SetViewOnLoad = ({ coords }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(coords, 15); // puedes ajustar el zoom si lo deseas
    }, [coords, map]);

    return null;
};


const NuevaIncidencia = () => {
    const posicionInicial = [-12.0464, -77.0428]; // Lima por defecto
    const [UbicacionActual, setUbicacionActual] = useState([-12.0464, -77.0428]); // Lima por defecto
    const [hasScrolled, setHasScrolled] = useState(false);
    const [cargandoUbicacion, setCargandoUbicacion] = useState(true);
    const sentinelRef = useRef(null);

    const formik = useFormik({
        initialValues: {
            tipoCaso: "",
            subTipoCaso: "",
            fecha: dayjsConZona().format('YYYY-MM-DD'),
            hora: dayjsConZona(),
            descripcion: "",
            fotos: [],
            ubicacion: { lat: posicionInicial[0], lng: posicionInicial[1] },
        },
        validationSchema: Yup.object({
            tipoCaso: Yup.string().required("Campo requerido"),
            subTipoCaso: Yup.string().required("Campo requerido"),
            fecha: Yup.date().required("Campo requerido"),
            hora: Yup.date().required("Campo requerido"),
            descripcion: Yup.string().required("Campo requerido"),
            ubicacion: Yup.object({
                lat: Yup.number(),
                lng: Yup.number(),
            }),
            fotos: Yup.array().of(Yup.mixed()),
        }),
        onSubmit: (values) => {
            console.log("Valores enviados:", values);
        },
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([e]) => setHasScrolled(!e.isIntersecting),
            { threshold: 0 }
        );
        const current = sentinelRef.current;
        if (current) observer.observe(current);
        return () => current && observer.unobserve(current);
    }, []);

    useEffect(() => {
        setCargandoUbicacion(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [position.coords.latitude, position.coords.longitude];
                formik.setFieldValue("ubicacion", {
                    lat: coords[0],
                    lng: coords[1],
                }, false);
                setUbicacionActual(coords);
                setCargandoUbicacion(false); // ✅ Oculta el loader al obtener ubicación
            },
            (error) => {
                toast.error(`Error al obtener ubicación: ${error.message}`);
                setCargandoUbicacion(false); // ✅ Oculta incluso si falla
            }
        );
    }, []);


    const handleAgregarFoto = (file) => {
        const reader = new FileReader();
        reader.onload = () => {
            formik.setFieldValue("fotos", [...formik.values.fotos, reader.result], false);
        };
        reader.readAsDataURL(file);
    };

    const handleEliminarFoto = (foto) => {
        formik.setFieldValue(
            "fotos",
            formik.values.fotos.filter((f) => f !== foto)
            , false
        );
    };

    const markerIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    return (
        <div className="h-full flex flex-col">
            <div ref={sentinelRef} className="h-1" />
            <form onSubmit={formik.handleSubmit} >
                <div className={`px-6 mb-4 sticky top-0 z-10 p-4 transition-all duration-300 ${hasScrolled ? 'shadow-md bg-white' : ' bg-gray-50'}`}>
                    <div className='flex items-center justify-between max-w-md container mx-auto'>
                        <h1 className="text-2xl font-bold text-gray-900">Nueva incidencia</h1>
                    </div>
                </div>

                <div className='pb-5 px-6 container mx-auto max-w-md flex-1 flex flex-col'>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Tipo de caso */}
                        <div className="col-span-2">
                            <FormControl size="small" fullWidth>
                                <Select
                                    name="tipoCaso"
                                    value={formik.values.tipoCaso}
                                    onChange={formik.handleChange}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Selecciona tipo de caso</MenuItem>
                                    <MenuItem value="tipo1">Tipo 1</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        {/* Subtipo */}
                        <div className="col-span-2">
                            <FormControl size="small" fullWidth>
                                <Select
                                    name="subTipoCaso"
                                    value={formik.values.subTipoCaso}
                                    onChange={formik.handleChange}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Selecciona subtipo</MenuItem>
                                    <MenuItem value="sub1">Subtipo 1</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        {/* Fecha y hora */}
                        <div>
                            <DatePicker
                                disabled
                                value={dayjsConZona(formik.values.fecha)}
                                slotProps={{ textField: { size: "small", fullWidth: true } }}
                            />
                        </div>
                        <div>
                            <TimePicker
                                ampm={false}
                                value={dayjsConZona(formik.values.hora)}
                                slotProps={{ textField: { size: "small", fullWidth: true } }}
                                minTime={dayjsConZona().subtract(2, 'hour')}
                                maxTime={dayjsConZona()}
                                onChange={(newValue) => {
                                    formik.setFieldValue("hora", dayjsConZona(newValue), false);
                                }}
                            />
                        </div>

                        {/* Mapa con marcador fijo en el centro */}
                        <div className="col-span-2 relative">
                            {cargandoUbicacion && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[500]">
                                    <CircularProgress color="primary" />
                                </div>
                            )}
                            <MapContainer
                                center={posicionInicial}
                                zoom={15}
                                style={{ height: "300px", width: "100%" }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; OpenStreetMap contributors"
                                />
                                <SetViewOnLoad coords={UbicacionActual} />
                            </MapContainer>

                            {/* Icono marcador fijo en el centro tipo Uber */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-[400]">
                                <img src="https://cdn-icons-png.flaticon.com/512/447/447031.png" width={32} height={32} alt="Marcador" />
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="col-span-2">
                            <TextField
                                label="Descripción"
                                name="descripcion"
                                value={formik.values.descripcion}
                                onChange={formik.handleChange}
                                size="small"
                                multiline
                                rows={3}
                                fullWidth
                            />
                        </div>

                        {/* Fotos */}
                        <div className="col-span-2 flex flex-col gap-2">
                            <span className="font-medium text-gray-900">Fotos:</span>
                            <div className="flex gap-3 flex-wrap">
                                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                                    <span className="text-2xl font-bold text-gray-500">+</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) handleAgregarFoto(file);
                                        }}
                                    />
                                </label>

                                {formik.values.fotos.map((foto, index) => (
                                    <div key={`Foto-${index}`} className="relative group">
                                        <Zoom>
                                            <div className="w-24 h-24 rounded-lg overflow-hidden shadow">
                                                <img src={foto} alt={`foto-${index}`} className="w-full h-full object-cover" />
                                            </div>
                                        </Zoom>
                                        <button
                                            type="button"
                                            onClick={() => handleEliminarFoto(foto)}
                                            className="absolute top-1 right-1 bg-black bg-opacity-60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Registrar incidencia
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NuevaIncidencia;
