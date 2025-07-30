import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ imageUrl, isOpen, onClose }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[95vh] p-6 bg-black/95 border-blue-400/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-5 w-5 text-white" />
          <span className="sr-only">Close</span>
        </button>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full h-full flex items-center justify-center"
        >
          <img
            src={imageUrl}
            alt="Full size"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 