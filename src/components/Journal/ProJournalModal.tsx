import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ProJournalModalProps {
  onClose: () => void;
}

export const ProJournalModal: React.FC<ProJournalModalProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    onClose(); // First try to close the modal via prop (if available, for consistency)
    navigate(-1); // Then navigate back in history
  };

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
          <BookOpen className="w-5 h-5" />
          Pro Journal
        </h2>
        <div className="w-16">{/* Spacer to balance the 'Back' button */}</div>
      </div>
      <iframe
        src="https://journal-amo0.onrender.com"
        className="flex-1 w-full border-none"
        title="Pro Journal"
      />
    </motion.div>
  );
};
