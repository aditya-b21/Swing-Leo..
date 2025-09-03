import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, LineChart, Lock, CreditCard, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '@/components/Payment/PaymentModal';

interface LiveStockDataModalProps {
  onClose: () => void;
}

export const LiveStockDataModal: React.FC<LiveStockDataModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleBack = () => {
    onClose();
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  if (!isVerified) {
    return (
      <motion.div 
        className="w-full mx-auto py-4 px-4 sm:px-6 flex items-center justify-center h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 shadow-2xl rounded-3xl overflow-hidden p-4 sm:p-6 w-full max-w-sm sm:max-w-4xl">
          <CardHeader className="text-center space-y-3 mb-4">
            <Lock className="w-10 h-10 text-green-400 mx-auto" />
            <CardTitle className="text-green-400 text-3xl font-extrabold">
              Premium Community Access
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg leading-relaxed">
              Subscribe to access our exclusive trading community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center space-y-6">
              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm">
                <CreditCard className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-400 mb-4">Here’s what you get inside:</h3>
                <ul className="text-left space-y-2 text-gray-300 text-sm leading-snug">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🏠 Home Dashboard – Clean, simple, and powerful start to your trading journey.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />📓 Pro Journal – Track your trades, refine your strategy, and learn from every move.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🎯 Setup Tracker – Never miss a winning setup with organized, easy-to-follow tracking.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🔍 Smart Scanner – Find high-probability stocks instantly with AI-powered filters.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🌐 Community – Connect, share, and grow with like-minded traders.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />📈 Sector Rotation Tool – Spot money flow between sectors for better market timing.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🚀 LIVE Sector Rotation & Stock Data – Real-time insights, real trading advantage.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🧮 Trading Calculator – Manage risk & reward with precision.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🤖 LEO AI – Your personal AI-powered swing trading assistant.</li>
                </ul>
              </div>
              <PaymentModal onVerificationChange={setIsVerified}>
                <motion.div
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(34,197,94,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Button size="lg" className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform border border-green-400">
                    <CreditCard className="w-5 h-5 mr-3" />
                    JOIN NOW
                  </Button>
                </motion.div>
              </PaymentModal>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  } else {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex flex-col bg-black bg-opacity-95 backdrop-blur-lg"
      >
        <div className="flex justify-between items-center p-4 bg-gray-900 shadow-md flex-shrink-0">
          <Button
            onClick={handleBack}
            variant="outline"
            className="text-white border-gray-700 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Live Stock Data
          </h2>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="text-white border-gray-700 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="bg-white/10 p-4 text-center text-yellow-300 text-sm italic">
          ⚡ Hang tight, LEO is working for you! Fetching real-time stock data can take less than 2 minutes. Your dashboard will be ready shortly. 📊
        </div>
        <iframe
          ref={iframeRef}
          src="https://swing-leofy-analysis-pvp3.onrender.com/"
          className="flex-1 w-full border-none"
          title="Live Stock Data"
        />
      </motion.div>
    );
  }
};
