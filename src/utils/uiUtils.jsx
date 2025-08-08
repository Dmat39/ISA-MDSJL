import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

export const getEstadoBadge = (estado) => {
    switch (estado) {
        case "APROBADO":
            return {
                className: "bg-green-100 text-green-800 hover:bg-green-100",
                icon: <CheckCircle className="w-3 h-3" />,
            }
        case "RECHAZADO":
            return {
                className: "bg-red-100 text-red-800 hover:bg-red-100",
                icon: <XCircle className="w-3 h-3" />,
            }
        case "PENDIENTE":
            return {
                className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                icon: <AlertCircle className="w-3 h-3" />,
            }
        default:
            return {
                className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
                icon: <AlertCircle className="w-3 h-3" />,
            }
    }
}