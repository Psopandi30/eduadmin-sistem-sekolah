import { useState, useEffect, useCallback } from 'react';
import { announcementDataGlobal, updateAnnouncementsGlobal, Announcement } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';

export const useAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('announcements_data_v10');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Failed to parse announcements", e);
                }
            }
        }
        return announcementDataGlobal;
    });

    const [loading, setLoading] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        if (!isSupabaseConfigured()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'announcements_data_v10').single();
            if (data?.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                setAnnouncements(parsed);
                updateAnnouncementsGlobal(parsed);
                localStorage.setItem('announcements_data_v10', JSON.stringify(parsed));
            }
        } catch (err) {
            console.warn("No cloud announcements found");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const saveAnnouncements = async (newData?: Announcement[]) => {
        const d = newData || announcements;
        setAnnouncements(d);
        updateAnnouncementsGlobal(d);
        localStorage.setItem('announcements_data_v10', JSON.stringify(d));

        if (!isSupabaseConfigured()) return;

        try {
            await supabase.from('app_settings').upsert({
                key: 'announcements_data_v10',
                value: d,
                updated_at: new Date().toISOString()
            });
            toast.success("Pengumuman berhasil disinkronkan!");
        } catch (err) {
            console.error("Error syncing announcements", err);
            toast.error("Gagal sinkron pengumuman.");
        }
    };

    return {
        announcements,
        setAnnouncements,
        saveAnnouncements,
        loading,
        refresh: fetchAnnouncements
    };
};
