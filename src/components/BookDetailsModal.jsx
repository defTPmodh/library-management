import { motion, AnimatePresence } from "framer-motion";

export default function BookDetailsModal({ book, onClose }) {
  if (!book) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Book Details</h2>
          <div className="space-y-3">
            <DetailRow label="Book ID" value={book.id} />
            <DetailRow label="Accession No" value={book.acc_no} />
            <DetailRow label="Class No" value={book.class_no} />
            <DetailRow label="Title" value={book.title} />
            <DetailRow label="Author" value={book.author} />
            <DetailRow label="Publisher" value={book.publisher} />
            <DetailRow label="Genre" value={book.genre} />
            <DetailRow label="Status" value={book.status} />
            <DetailRow label="Library" value={book.library} />
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex">
      <span className="font-medium w-32 text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="text-gray-800 dark:text-gray-200">{value || 'N/A'}</span>
    </div>
  );
} 