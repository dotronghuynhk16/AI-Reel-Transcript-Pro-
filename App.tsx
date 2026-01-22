
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './components/Button';
import { transcribeMedia, parseUrlTranscript } from './services/geminiService';
import { TranscriptResult, AppStatus } from './types';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [history, setHistory] = useState<TranscriptResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('transcript_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('transcript_history', JSON.stringify(history));
  }, [history]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to ~20MB for browser-based processing)
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Please use a video under 20MB.");
      return;
    }

    setStatus(AppStatus.LOADING);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const transcriptText = await transcribeMedia(base64Data, file.type);
        
        const newResult: TranscriptResult = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          content: transcriptText,
          language: 'Auto-detected',
          source: file.name,
          title: file.name
        };

        setResult(newResult);
        setHistory(prev => [newResult, ...prev]);
        setStatus(AppStatus.SUCCESS);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "An error occurred during transcription.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setStatus(AppStatus.LOADING);
    setError(null);

    try {
      const response = await parseUrlTranscript(url);
      
      const newResult: TranscriptResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        content: response,
        language: 'N/A',
        source: url,
        title: 'URL Link Processing'
      };

      setResult(newResult);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Could not process link.");
      setStatus(AppStatus.ERROR);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('transcript_history');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col items-center mb-12 text-center">
        <div className="bg-indigo-600 p-3 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
          AI Reel Transcript <span className="text-indigo-400">Pro</span>
        </h1>
        <p className="text-slate-400 max-w-lg">
          Trích xuất transcript từ Facebook Reels, TikTok hoặc video tải lên bằng công nghệ AI Gemini 3 Flash siêu nhanh và chính xác.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        {/* Input Controls */}
        <section className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Link Input */}
            <form onSubmit={handleUrlSubmit} className="flex-1 space-y-3">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Dán link Video</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://facebook.com/reels/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 placeholder-slate-500 transition-all"
                />
                <Button type="submit" isLoading={status === AppStatus.LOADING && !!url}>
                  Phân tích
                </Button>
              </div>
            </form>

            <div className="hidden md:flex items-center text-slate-600 font-bold uppercase text-xs">hoặc</div>

            {/* File Upload */}
            <div className="flex-1 space-y-3">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Tải video/audio lên</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="video/*,audio/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 bg-slate-900/50 text-slate-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Chọn file (Tối đa 20MB)</span>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </section>

        {/* Results Area */}
        {(status === AppStatus.LOADING) && (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 rounded-2xl border border-slate-800 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-300 font-medium">Đang xử lý bằng AI...</p>
            <p className="text-slate-500 text-sm mt-1">Việc này có thể mất vài giây tùy thuộc vào độ dài video.</p>
          </div>
        )}

        {result && status !== AppStatus.LOADING && (
          <section className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-4 bg-slate-700/50 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Kết quả trích xuất</h2>
                <p className="text-xs text-slate-400 truncate max-w-xs">{result.source}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.content)}>
                  Sao chép
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setResult(null)}>
                  Đóng
                </Button>
              </div>
            </div>
            <div className="p-6 max-h-[500px] overflow-y-auto bg-slate-900/40 text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
              {result.content}
            </div>
          </section>
        )}

        {/* History Area */}
        {history.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lịch sử trích xuất
              </h3>
              <Button variant="ghost" size="sm" onClick={clearHistory}>Xóa lịch sử</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all cursor-pointer group"
                  onClick={() => setResult(item)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-200 truncate pr-4">{item.title || 'Untitled'}</h4>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 italic mb-3">
                    {item.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-indigo-400 font-semibold">{item.language}</span>
                    <button className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      Xem chi tiết &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-auto py-8 text-center text-slate-600 text-sm">
        <p>&copy; 2024 AI Reel Transcript Pro. Powered by Google Gemini 3 Flash.</p>
        <p className="mt-1">Hỗ trợ 100+ ngôn ngữ - Nhanh - Chính xác - Miễn phí.</p>
      </footer>
    </div>
  );
};

export default App;
