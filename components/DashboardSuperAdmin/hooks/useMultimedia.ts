import { useState, useEffect, useCallback } from 'react';
import {
    broadcastsDataGlobal,
    updateBroadcastsGlobal,
    multimediaSettingsGlobal,
    updateMultimediaSettingsGlobal,
    Broadcast
} from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';
import logger from '../../../src/utils/logger';

export const useMultimedia = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>(broadcastsDataGlobal);
    const [channelSettings, setChannelSettings] = useState(multimediaSettingsGlobal);
    const [loading, setLoading] = useState(false);

    const fetchMultimedia = useCallback(async () => {
        if (!isSupabaseConfigured()) return;
        setLoading(true);
        try {
            // 1. Fetch Broadcasts
            const { data: bRes } = await supabase.from('app_settings').select('value').eq('key', 'broadcasts_data_v10').maybeSingle();
            if (bRes?.value) {
                const parsed = typeof bRes.value === 'string' ? JSON.parse(bRes.value) : bRes.value;
                setBroadcasts(parsed);
                updateBroadcastsGlobal(parsed);
                localStorage.setItem('broadcasts_data_v10', JSON.stringify(parsed));
            }

            // 2. Fetch Settings
            const { data: sRes } = await supabase.from('app_settings').select('value').eq('key', 'multimedia_settings_v10').maybeSingle();
            if (sRes?.value) {
                const parsed = typeof sRes.value === 'string' ? JSON.parse(sRes.value) : sRes.value;
                setChannelSettings(parsed);
                updateMultimediaSettingsGlobal(parsed);
                localStorage.setItem('multimedia_settings_v10', JSON.stringify(parsed));
            }
        } catch (err) {
            logger.warn("No cloud multimedia data found");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMultimedia();
    }, [fetchMultimedia]);

    const saveMultimedia = async (type: 'broadcasts' | 'settings', newData: any) => {
        if (type === 'broadcasts') {
            setBroadcasts(newData);
            updateBroadcastsGlobal(newData);
            localStorage.setItem('broadcasts_data_v10', JSON.stringify(newData));
        } else {
            setChannelSettings(newData);
            updateMultimediaSettingsGlobal(newData);
            localStorage.setItem('multimedia_settings_v10', JSON.stringify(newData));
        }

        if (!isSupabaseConfigured()) return;

        try {
            const key = type === 'broadcasts' ? 'broadcasts_data_v10' : 'multimedia_settings_v10';
            await supabase.from('app_settings').upsert({
                key,
                value: newData,
                updated_at: new Date().toISOString()
            });
            toast.success("Multimedia berhasil disinkronkan ke cloud!");
        } catch (err) {
            logger.error("Error syncing multimedia", err);
            toast.error("Gagal sinkron multimedia.");
        }
    };

    return {
        broadcasts,
        setBroadcasts: (data: Broadcast[]) => saveMultimedia('broadcasts', data),
        channelSettings,
        setChannelSettings: (data: any) => saveMultimedia('settings', data),
        loading,
        refresh: fetchMultimedia
    };
};
