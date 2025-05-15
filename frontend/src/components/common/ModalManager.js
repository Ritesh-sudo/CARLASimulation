import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dialog } from '@mui/material';
import { closeModal } from '../../redux/slices/uiSlice';

// Import modal components as needed
// import AddRobotModal from '../robots/AddRobotModal';
// import StartMissionModal from '../missions/StartMissionModal';
// import ViewAlertModal from '../alerts/ViewAlertModal';
import SimulatorRobotModal from '../modals/SimulatorRobotModal';

/**
 * This component manages all modals in the application.
 * It renders the appropriate modal based on the modalType in the UI state.
 */
const ModalManager = () => {
    const dispatch = useDispatch();
    const { isOpen, modalType, modalData } = useSelector((state) => state.ui.modalState);

    const handleClose = () => {
        dispatch(closeModal());
    };

    // Render the appropriate modal based on modalType
    const renderModal = () => {
        switch (modalType) {
            // case 'ADD_ROBOT':
            //   return <AddRobotModal onClose={handleClose} />;
            // case 'START_MISSION':
            //   return <StartMissionModal robotId={modalData?.robotId} onClose={handleClose} />;
            // case 'VIEW_ALERT':
            //   return <ViewAlertModal alertId={modalData?.alertId} onClose={handleClose} />;
            case 'SIMULATOR_ROBOT':
                return <SimulatorRobotModal robot={modalData?.robot} />;
            default:
                return null;
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
        >
            {renderModal()}
        </Dialog>
    );
};

export default ModalManager; 