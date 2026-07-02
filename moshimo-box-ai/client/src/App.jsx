import { useState } from 'react';
import TitleScreen from './components/TitleScreen';
import InputPanel from './components/InputPanel';
import LoadingOverlay from './components/LoadingOverlay';
import WorldCard from './components/WorldCard';
import ChatPanel from './components/ChatPanel';
import Gallery from './components/Gallery';
import useLocalWorlds from './hooks/useLocalWorlds';
import { generateWorld, sendChatMessage } from './api';

export default function App() {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState('create'); // create | gallery
  const [premise, setPremise] = useState('');
  const [tone, setTone] = useState('sf');
  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const { worlds, save, remove } = useLocalWorlds();

  const handleGenerate = async () => {
    if (!premise.trim() || loading) return;
    setLoading(true);
    setError('');
    setChatHistory([]);
    try {
      const result = await generateWorld(premise, tone);
      setWorld(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text) => {
    const nextHistory = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(nextHistory);
    setChatLoading(true);
    try {
      const { reply } = await sendChatMessage(world, chatHistory, text);
      setChatHistory([...nextHistory, { role: 'assistant', content: reply }]);
    } catch (e) {
      setChatHistory([...nextHistory, { role: 'assistant', content: `エラー: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleOpenSaved = (w) => {
    setWorld(w);
    setChatHistory([]);
    setTab('create');
  };

  if (!entered) {
    return <TitleScreen onEnter={() => setEntered(true)} />;
  }

  return (
    <div className="min-h-screen bg-box-bg text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-box-accent">📦 もしもボックスAI</h1>
        <nav className="flex gap-2">
          <button
            onClick={() => setTab('create')}
            className={`px-3 py-1.5 rounded-full text-sm ${
              tab === 'create' ? 'bg-box-accent text-box-bg font-bold' : 'bg-white/10'
            }`}
          >
            つくる
          </button>
          <button
            onClick={() => setTab('gallery')}
            className={`px-3 py-1.5 rounded-full text-sm ${
              tab === 'gallery' ? 'bg-box-accent text-box-bg font-bold' : 'bg-white/10'
            }`}
          >
            図鑑（{worlds.length}）
          </button>
        </nav>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {tab === 'gallery' ? (
          <Gallery worlds={worlds} onOpen={handleOpenSaved} onDelete={remove} />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <InputPanel
                premise={premise}
                setPremise={setPremise}
                tone={tone}
                setTone={setTone}
                onSubmit={handleGenerate}
                loading={loading}
              />
              {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
            </div>

            <div className="relative space-y-6">
              {loading && <LoadingOverlay />}
              {world ? (
                <>
                  <WorldCard
                    world={world}
                    onSave={() => save(world)}
                    saved={worlds.some((w) => w.id === world.id)}
                  />
                  <ChatPanel
                    world={world}
                    history={chatHistory}
                    onSend={handleSend}
                    onClear={() => setChatHistory([])}
                    loading={chatLoading}
                  />
                </>
              ) : (
                !loading && (
                  <div className="bg-box-card rounded-2xl p-6 text-white/50 text-sm h-full flex items-center justify-center min-h-[200px]">
                    左側で「もしも」を入力して世界を開いてみましょう。
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
