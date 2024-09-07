'use client';

import { useState } from 'react';
import HomePage from "@/components/ui/HomePage";
import { Showstems } from "@/components/ui/showstems";

export default function Home() {
  const [processedAudio, setProcessedAudio] = useState<{ vocals: string; accompaniment: string; originalFileName: string } | null>(null);

  const handleProcessComplete = (vocals: string, accompaniment: string, originalFileName: string) => {
    setProcessedAudio({ vocals, accompaniment, originalFileName });
  };

  return (
    <>
      {processedAudio ? (
        <Showstems 
          vocals={processedAudio.vocals} 
          accompaniment={processedAudio.accompaniment} 
          originalFileName={processedAudio.originalFileName}
        />
      ) : (
        <HomePage onProcessComplete={handleProcessComplete} />
      )}
    </>
  );
}
