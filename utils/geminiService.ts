import { GoogleGenAI } from '@google/genai';

// Inisialisasi Google Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
    // Validasi API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY tidak ditemukan. Silakan tambahkan API key ke file .env.local');
    }

    // Konfigurasi request
    const contents = [
      // System instruction sebagai first message
      {
        role: 'user',
        parts: [{ text: `Kamu adalah asisten AI pembelajaran yang ramah dan membantu untuk siswa sekolah dasar di Indonesia.
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

    return text;

  } catch (error) {
    console.error('Error calling Gemini API:', error);

    // Handle berbagai jenis error
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return '❌ API Key Google Gemini belum dikonfigurasi. Silakan hubungi administrator untuk mengatur API key.';
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return '❌ Kuota API Google Gemini telah habis. Silakan coba lagi nanti.';
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