"use client";

import { useState, ChangeEvent, DragEvent, useRef } from 'react';
import { Upload, PlayCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const HomePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vocals, setVocals] = useState<string | null>(null);
  const [accompaniment, setAccompaniment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelection(droppedFile);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File | undefined) => {
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid audio file.');
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('No file selected.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setVocals(null);
    setAccompaniment(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:5000/split', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'An error occurred while processing the file.');
      } else {
        const data = await response.json();
        setVocals(data.vocals);
        setAccompaniment(data.accompaniment);
      }
    } catch (error) {
      setError('An error occurred while processing the file.');
    }

    setIsProcessing(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="relative">
          <Card className="w-full bg-white shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-extrabold text-center text-gray-800">VocalSplit</CardTitle>
              <CardDescription className="text-center text-gray-600 font-medium">
                Separate vocals from instrumentals instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 font-medium">
                  Drag and drop your audio file here, or
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  ref={fileInputRef}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 font-semibold"
                  onClick={handleButtonClick}
                >
                  Select Audio File
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center items-center h-20 relative">
              {file ? (
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-11/12 absolute bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  {isProcessing ? 'Processing...' : 'Process Audio'}
                </Button>
              ) : (
                <p className="text-sm text-gray-500 text-center w-full">Upload an audio file to begin</p>
              )}
            </CardFooter>
          </Card>
          {(file || error || vocals || accompaniment) && (
            <div className="absolute w-full left-0 top-full mt-4">
              {file && (
                <Alert className="bg-green-100 border-green-400 text-green-700 rounded-lg">
                  <PlayCircle className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <AlertTitle className="font-semibold">File Uploaded</AlertTitle>
                    <AlertDescription className="break-all">
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB) is ready for processing.
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              {error && (
                <Alert className="bg-red-100 border-red-400 text-red-700 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <AlertTitle className="font-semibold">Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </div>
                </Alert>
              )}
              {vocals && (
                <Alert className="bg-green-100 border-green-400 text-green-700 rounded-lg">
                  <PlayCircle className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <AlertTitle className="font-semibold">Vocals</AlertTitle>
                    <AlertDescription className="break-all">
                      {vocals}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              {accompaniment && (
                <Alert className="bg-green-100 border-green-400 text-green-700 rounded-lg">
                  <PlayCircle className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <AlertTitle className="font-semibold">Accompaniment</AlertTitle>
                    <AlertDescription className="break-all">
                      {accompaniment}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;