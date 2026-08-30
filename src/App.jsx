import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import JobAnalyzerForm from './components/JobAnalyzerForm';
import RiskReportView from './components/RiskReportView';
import PresetLibrary from './components/PresetLibrary';
import ScamEducation from './components/ScamEducation';
import ExtensionGuide from './components/ExtensionGuide';
import HistoryDrawer from './components/HistoryDrawer';
import { analyzeJobPosting } from './utils/detectorEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyzer'); // 'analyzer' | 'presets' | 'education' | 'extension'
  const [currentJob, setCurrentJob] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // History State in LocalStorage
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('verijob_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('verijob_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  }, [history]);

  const handleAnalyze = (jobData) => {
    setIsLoading(true);
    setTimeout(() => {
      const result = analyzeJobPosting(jobData);
      setCurrentJob(jobData);
      setCurrentResult(result);
      setIsLoading(false);

      // Add to history
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        jobData,
        result
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 19)]); // Keep last 20
    }, 400); // Simulate snappy async evaluation
  };

  const handleSelectSample = (sample) => {
    setActiveTab('analyzer');
    handleAnalyze(sample);
  };

  const handleSelectHistoryItem = (historyItem) => {
    setActiveTab('analyzer');
    setCurrentJob(historyItem.jobData);
    setCurrentResult(historyItem.result);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleReset = () => {
    setCurrentJob(null);
    setCurrentResult(null);
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        toggleHistory={() => setIsHistoryOpen(true)}
      />

      <main>
        {activeTab === 'analyzer' && (
          <div>
            {currentResult ? (
              <RiskReportView
                result={currentResult}
                jobData={currentJob}
                onReset={handleReset}
              />
            ) : (
              <JobAnalyzerForm
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {activeTab === 'presets' && (
          <PresetLibrary onSelectSample={handleSelectSample} />
        )}

        {activeTab === 'education' && (
          <ScamEducation />
        )}

        {activeTab === 'extension' && (
          <ExtensionGuide />
        )}
      </main>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
