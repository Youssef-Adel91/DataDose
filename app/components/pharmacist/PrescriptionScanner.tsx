'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, Clock, CheckCircle } from 'lucide-react';

interface PrescriptionScannerProps {
  onScanComplete?: (drugs: string[]) => void;
}

export default function PrescriptionScanner({ onScanComplete }: PrescriptionScannerProps) {
  const [prescriptionText, setPrescriptionText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPrescriptionText(''); // reset
    }
  };

  const handleOCR = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setPrescriptionText('');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to run Vision OCR');
      }

      const data = await response.json();
      const extractedDrugs: string[] = data.extracted_drugs || [];
      
      setPrescriptionText(
        `EXTRACTED ENTITIES:\n--------------------------\n` + 
        (extractedDrugs.length > 0 
          ? extractedDrugs.map((d, i) => `${i + 1}. ${d}`).join('\n')
          : "No medications detected.")
      );

      if (extractedDrugs.length > 0 && onScanComplete) {
        onScanComplete(extractedDrugs);
      }
    } catch (error) {
      console.error(error);
      setPrescriptionText('Error: Failed to process prescription image via Vision API.');
    } finally {
      setIsScanning(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8"
      id="scanner"
    >
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Prescription Scanner</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Upload or Scan Prescription
          </label>

          <label className="block w-full cursor-pointer">
            <motion.div
              whileHover={{ borderColor: '#14b8a6' }}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-teal-50/30 transition shadow-sm"
            >
              {selectedFile ? (
                <>
                  <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500 mt-1">Ready to scan</p>
                </>
              ) : (
                <>
                  <Camera className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700">Drag and drop or click to upload</p>
                  <p className="text-sm text-slate-500 mt-1">Supports: JPG, PNG, PDF</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </motion.div>
          </label>

          <motion.button
            whileHover={selectedFile ? { scale: 1.02 } : {}}
            whileTap={selectedFile ? { scale: 0.98 } : {}}
            onClick={handleOCR}
            disabled={isScanning || !selectedFile}
            className="w-full bg-gradient-teal text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Scanning...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Scan Prescription
              </>
            )}
          </motion.button>
        </div>

        {/* Extracted Data */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Extracted Information
          </label>

          <div className="bg-white/50 border border-slate-200 rounded-lg p-4 h-48 overflow-y-auto">
            {prescriptionText ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                {prescriptionText}
              </p>
            ) : (
              <p className="text-sm text-slate-400 text-center mt-20">
                Scan a prescription to see extracted data
              </p>
            )}
          </div>

          {prescriptionText && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="w-full bg-teal-500 text-white font-semibold py-2 rounded-lg hover:bg-teal-600 transition"
            >
              Proceed to Interaction Check
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
