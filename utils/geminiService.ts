import { GoogleGenAI } from '@google/genai';
import { supabase } from '../src/lib/supabase';
import logger from '../src/utils/logger';

// Cache untuk API key dan client
let geminiClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

/**
 * Mendapatkan API key aktif dari database
 */
async function getActiveApiKey(providerType: string = 'gemini'): Promise<string> {
  try {
    // Cek cache terlebih dahulu
    if (cachedApiKey) {
      return cachedApiKey;
    }

    // Query API key aktif dari database
    const { data, error } = await supabase
      .from('ai_api_keys')
      .select(`
        api_key,
        ai_providers!inner(provider_type)
      `)
      .eq('is_active', true)
      .eq('ai_providers.provider_type', providerType)
      .order('last_used_at', { ascending: false, nullsFirst: true })
      .limit(1)
      .single();

    if (error || !data) {
      // Fallback ke environment variables jika database belum siap
      const envKey = process.env.GEMINI_API_KEY;
      if (envKey && envKey !== 'your_gemini_api_key_here') {
        cachedApiKey = envKey;
        return envKey;
      }
      throw new Error('Tidak ada API key aktif untuk provider Gemini');
    }

    cachedApiKey = data.api_key;
    return cachedApiKey || '';

  } catch (error) {
    logger.error('Error getting API key:', error);
    throw new Error('Gagal mendapatkan API key dari database');
  }
}

/**
 * Update statistik penggunaan API key
 */
async function updateApiKeyUsage() {
  if (!cachedApiKey) return;
  try {
    await supabase.rpc('increment_api_key_usage', { key_val: cachedApiKey });
  } catch (err) {
    logger.warn('Failed to update usage count');
  }
}

/**
 * Mendapatkan atau membuat Gemini client
 */
async function getGeminiClient(): Promise<GoogleGenAI> {
  if (!geminiClient) {
    const apiKey = await getActiveApiKey('gemini');
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/**
 * Simpan chat session ke database
 */
export async function saveChatSession(userId: string, message: string, response: string): Promise<void> {
  try {
    // Buat session baru atau dapatkan yang existing
    const { data: session, error: sessionError } = await supabase
      .from('ai_chat_sessions')
      .insert({
        user_id: userId,
        provider_type: 'gemini',
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      logger.warn('Failed to create chat session:', sessionError);
      return;
    }

    // Simpan pesan user
    await supabase.from('ai_chat_messages').insert({
      session_id: session.id,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    });

    // Simpan respons AI
    await supabase.from('ai_chat_messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: response,
      created_at: new Date().toISOString()
    });

  } catch (error) {
    logger.warn('Failed to save chat session:', error);
  }
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface ChatSession {
  history: GeminiMessage[];
  currentMessage: string;
}

/**
 * Mengirim pesan ke Google Gemini AI dan mendapatkan respons
 * @param message Pesan dari user
 * @param history Riwayat percakapan sebelumnya (opsional)
 * @returns Respons dari AI
 */
export async function sendToGemini(message: string, history: GeminiMessage[] = []): Promise<string> {
  try {
    // Dapatkan Gemini client dengan API key dari database
    const genAI = await getGeminiClient();

    // Konfigurasi request
    const contents = [
      // System instruction sebagai first message
      {
        role: 'user',
        parts: [{
          text: `Kamu adalah asisten AI pembelajaran yang ramah dan membantu untuk siswa sekolah dasar di Indonesia.
        Tugasmu adalah membantu siswa belajar berbagai mata pelajaran dengan cara yang menyenangkan dan mudah dipahami.

        Pedoman komunikasi:
        - Gunakan bahasa Indonesia yang sederhana dan ramah
        - Jelaskan konsep dengan analogi yang mudah dipahami
        - Berikan contoh-contoh konkret
        - Dorong siswa untuk berpikir kritis
        - Jika siswa bertanya tentang topik yang tidak sesuai untuk usia sekolah dasar, arahkan ke topik yang lebih sesuai
        - Selalu akhiri dengan pertanyaan untuk mendorong diskusi lebih lanjut

        Mata pelajaran yang bisa dibantu:
        - Matematika (penjumlahan, pengurangan, perkalian, pembagian, geometri)
        - Bahasa Indonesia (membaca, menulis, tata bahasa)
        - IPA (sains dasar, alam sekitar)
        - IPS (sejarah, geografi, kewarganegaraan)
        - Seni dan budaya
        - Pendidikan agama Islam
        - Bahasa Inggris dasar` }]
      },
      {
        role: 'model',
        parts: [{ text: 'Baik, saya akan membantu siswa sekolah dasar belajar dengan cara yang menyenangkan dan mudah dipahami.' }]
      },
      // History chat
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }]
      })),
      // Pesan user saat ini
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    // Panggil API
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';

    // Update usage count setelah berhasil
    await updateApiKeyUsage();

    return text;

  } catch (error) {
    logger.error('Error calling Gemini API:', error);

    // Handle berbagai jenis error
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('Tidak ada API key')) {
        return '❌ API Key Google Gemini belum dikonfigurasi. Silakan hubungi administrator untuk mengatur API key di menu Manajemen AI.';
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return '❌ Kuota API Google Gemini telah habis. Administrator akan mengatur API key baru di menu Manajemen AI.';
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return '❌ Tidak dapat terhubung ke server AI. Periksa koneksi internet Anda.';
      }
    }

    return '❌ Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.';
  }
}

/**
 * Membuat title untuk chat session berdasarkan pesan pertama
 * @param firstMessage Pesan pertama dari user
 * @returns Title yang di-generate
 */
export function generateChatTitle(firstMessage: string): string {
  const lower = firstMessage.toLowerCase();

  // Deteksi topik berdasarkan kata kunci
  if (lower.includes('matematika') || lower.includes('hitung') || lower.includes('kali') || lower.includes('bagi')) {
    return 'Belajar Matematika';
  }
  if (lower.includes('bahasa indonesia') || lower.includes('membaca') || lower.includes('menulis')) {
    return 'Belajar Bahasa Indonesia';
  }
  if (lower.includes('ipa') || lower.includes('sains') || lower.includes('alam')) {
    return 'Belajar IPA';
  }
  if (lower.includes('ips') || lower.includes('sejarah') || lower.includes('geografi')) {
    return 'Belajar IPS';
  }
  if (lower.includes('islam') || lower.includes('agama') || lower.includes('quran')) {
    return 'Belajar Agama Islam';
  }
  if (lower.includes('english') || lower.includes('inggris')) {
    return 'Belajar Bahasa Inggris';
  }
  if (lower.includes('puisi') || lower.includes('cerita') || lower.includes('menulis')) {
    return 'Kreativitas & Sastra';
  }

  // Default title
  return 'Belajar Bersama AI';
}