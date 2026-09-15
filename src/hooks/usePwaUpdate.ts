import { useSyncExternalStore } from 'react';
import { getUpdateState, subscribeToUpdates } from '../../services/updateService';

export function usePwaUpdate() {
    return useSyncExternalStore(subscribeToUpdates, getUpdateState, getUpdateState);
}
