import React from 'react';
import { Button } from '@mui/material';
import { Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import ModalSerenos from '../../Components/Modals/ModalSerenos';

const HistorialSerenos = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 mb-4 bg-white">
                <div className="flex items-center justify-between max-w-4xl container mx-auto py-4">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => navigate('/')}
                            variant="outlined"
                            size="small"
                            sx={{
                                minWidth: '40px',
                                width: '40px',
                                height: '40px',
                                padding: 0,
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0',
                                backgroundColor: '#fff',
                                color: '#333',
                            }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Historial de Serenos</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-0 container mx-auto max-w-4xl flex-1 flex flex-col">
                <div className="bg-white rounded-lg  flex-1 flex flex-col overflow-hidden">
                    <ModalSerenos embedded={true} />
                </div>
            </div>
        </div>
    );
};

export default HistorialSerenos;